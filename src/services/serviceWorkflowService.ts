import { RequestStatus, RequestPriority } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// WORKFLOW INTERFACES
// ============================================================================

export interface WorkflowState {
  value: RequestStatus;
  context: {
    requestId: string;
    serviceId: string;
    userId: string;
    requiresApproval: boolean;
    priority: RequestPriority;
    assignedTo?: string;
    approvedBy?: string;
    metadata: Record<string, any>;
  };
}

export interface WorkflowEvent {
  type: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ASSIGN' | 'START' | 'COMPLETE' | 'CANCEL' | 'HOLD' | 'RESUME';
  userId: string;
  data?: Record<string, any>;
}

export interface StateTransition {
  from: RequestStatus;
  to: RequestStatus;
  event: WorkflowEvent['type'];
  guard?: (context: WorkflowState['context'], event: WorkflowEvent) => boolean;
  action?: (context: WorkflowState['context'], event: WorkflowEvent) => Promise<void>;
}

export interface WorkflowRule {
  name: string;
  description: string;
  condition: (context: WorkflowState['context']) => boolean;
  actions: Array<{
    type: 'AUTO_APPROVE' | 'AUTO_ASSIGN' | 'PRIORITY_ESCALATION' | 'NOTIFICATION';
    parameters: Record<string, any>;
  }>;
}

// ============================================================================
// SERVICE WORKFLOW SERVICE
// ============================================================================

export class ServiceWorkflowService {
  private transitions: StateTransition[] = [];
  private rules: WorkflowRule[] = [];

  constructor() {
    this.initializeTransitions();
    this.initializeRules();
  }

  // ============================================================================
  // STATE MACHINE CONFIGURATION
  // ============================================================================

  private initializeTransitions(): void {
    this.transitions = [
      // Initial submission
      {
        from: 'PENDING' as RequestStatus,
        to: 'APPROVED' as RequestStatus,
        event: 'SUBMIT',
        guard: (context) => !context.requiresApproval,
      },
      {
        from: 'PENDING' as RequestStatus,
        to: 'PENDING' as RequestStatus,
        event: 'SUBMIT',
        guard: (context) => context.requiresApproval,
      },

      // Approval process
      {
        from: 'PENDING' as RequestStatus,
        to: 'APPROVED' as RequestStatus,
        event: 'APPROVE',
        guard: (context, event) => this.canApprove(context, event.userId),
      },
      {
        from: 'PENDING' as RequestStatus,
        to: 'REJECTED' as RequestStatus,
        event: 'REJECT',
        guard: (context, event) => this.canApprove(context, event.userId),
      },

      // Assignment and work progress
      {
        from: 'APPROVED' as RequestStatus,
        to: 'IN_PROGRESS' as RequestStatus,
        event: 'ASSIGN',
        guard: (context, event) => this.canAssign(context, event.userId),
      },
      {
        from: 'APPROVED' as RequestStatus,
        to: 'IN_PROGRESS' as RequestStatus,
        event: 'START',
        guard: (context, event) => this.canStart(context, event.userId),
      },
      {
        from: 'IN_PROGRESS' as RequestStatus,
        to: 'COMPLETED' as RequestStatus,
        event: 'COMPLETE',
        guard: (context, event) => this.canComplete(context, event.userId),
      },

      // Hold and resume
      {
        from: 'IN_PROGRESS' as RequestStatus,
        to: 'ON_HOLD' as RequestStatus,
        event: 'HOLD',
        guard: (context, event) => this.canHold(context, event.userId),
      },
      {
        from: 'ON_HOLD' as RequestStatus,
        to: 'IN_PROGRESS' as RequestStatus,
        event: 'RESUME',
        guard: (context, event) => this.canResume(context, event.userId),
      },

      // Cancellation (allowed from multiple states)
      {
        from: 'PENDING' as RequestStatus,
        to: 'CANCELLED' as RequestStatus,
        event: 'CANCEL',
        guard: (context, event) => this.canCancel(context, event.userId),
      },
      {
        from: 'APPROVED' as RequestStatus,
        to: 'CANCELLED' as RequestStatus,
        event: 'CANCEL',
        guard: (context, event) => this.canCancel(context, event.userId),
      },
      {
        from: 'IN_PROGRESS' as RequestStatus,
        to: 'CANCELLED' as RequestStatus,
        event: 'CANCEL',
        guard: (context, event) => this.canCancel(context, event.userId),
      },
      {
        from: 'ON_HOLD' as RequestStatus,
        to: 'CANCELLED' as RequestStatus,
        event: 'CANCEL',
        guard: (context, event) => this.canCancel(context, event.userId),
      },
    ];
  }

  private initializeRules(): void {
    this.rules = [
      // Auto-approval for low-value requests
      {
        name: 'AUTO_APPROVE_LOW_VALUE',
        description: 'Auto-approve requests under $50',
        condition: (context) => {
          const amount = context.metadata.totalAmount || 0;
          return amount < 50 && !context.requiresApproval;
        },
        actions: [
          {
            type: 'AUTO_APPROVE',
            parameters: { reason: 'Low value auto-approval' },
          },
        ],
      },

      // Auto-assignment based on service category
      {
        name: 'AUTO_ASSIGN_BY_CATEGORY',
        description: 'Auto-assign based on service category',
        condition: (context) => {
          return context.metadata.serviceCategory === 'PRINTING' && !context.assignedTo;
        },
        actions: [
          {
            type: 'AUTO_ASSIGN',
            parameters: { 
              assigneeRole: 'SERVICE_PROVIDER',
              serviceCategory: 'PRINTING'
            },
          },
        ],
      },

      // Priority escalation for urgent requests
      {
        name: 'URGENT_PRIORITY_ESCALATION',
        description: 'Escalate urgent requests if not processed within 1 hour',
        condition: (context) => {
          const createdAt = new Date(context.metadata.createdAt);
          const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          return context.priority === RequestPriority.URGENT && hoursSinceCreation > 1;
        },
        actions: [
          {
            type: 'PRIORITY_ESCALATION',
            parameters: { escalateTo: 'MANAGER' },
          },
          {
            type: 'NOTIFICATION',
            parameters: { 
              type: 'URGENT_ESCALATION',
              recipients: ['manager'],
            },
          },
        ],
      },

      // Notification for overdue requests
      {
        name: 'OVERDUE_NOTIFICATION',
        description: 'Notify about overdue requests',
        condition: (context) => {
          const scheduledDelivery = context.metadata.scheduledDeliveryTime;
          if (!scheduledDelivery) return false;
          
          const deliveryTime = new Date(scheduledDelivery);
          return Date.now() > deliveryTime.getTime();
        },
        actions: [
          {
            type: 'NOTIFICATION',
            parameters: {
              type: 'OVERDUE_REQUEST',
              recipients: ['requester', 'assignee', 'manager'],
            },
          },
        ],
      },
    ];
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  async processEvent(
    currentState: WorkflowState,
    event: WorkflowEvent
  ): Promise<{
    newState: WorkflowState;
    actions: Array<{ type: string; parameters: Record<string, any> }>;
    success: boolean;
    error?: string;
  }> {
    try {
      // Find applicable transition
      const transition = this.findTransition(currentState.value, event);
      
      if (!transition) {
        return {
          newState: currentState,
          actions: [],
          success: false,
          error: `No valid transition from ${currentState.value} with event ${event.type}`,
        };
      }

      // Check guard conditions
      if (transition.guard && !transition.guard(currentState.context, event)) {
        return {
          newState: currentState,
          actions: [],
          success: false,
          error: `Transition guard failed for ${event.type} from ${currentState.value}`,
        };
      }

      // Create new state
      const newState: WorkflowState = {
        value: transition.to,
        context: {
          ...currentState.context,
          ...(event.data || {}),
        },
      };

      // Execute transition action
      if (transition.action) {
        await transition.action(newState.context, event);
      }

      // Apply workflow rules
      const ruleActions = await this.applyRules(newState);

      logger.info('Workflow transition processed', {
        requestId: currentState.context.requestId,
        from: currentState.value,
        to: newState.value,
        event: event.type,
        userId: event.userId,
      });

      return {
        newState,
        actions: ruleActions,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to process workflow event', {
        currentState: currentState.value,
        event: event.type,
        requestId: currentState.context.requestId,
      }, error as Error);

      return {
        newState: currentState,
        actions: [],
        success: false,
        error: 'Internal workflow error',
      };
    }
  }

  async validateTransition(
    currentState: RequestStatus,
    event: WorkflowEvent
  ): Promise<{
    valid: boolean;
    error?: string;
    nextState?: RequestStatus;
  }> {
    const transition = this.findTransition(currentState, event);
    
    if (!transition) {
      return {
        valid: false,
        error: `No valid transition from ${currentState} with event ${event.type}`,
      };
    }

    // For validation, we create a minimal context
    const mockContext = {
      requestId: 'validation',
      serviceId: 'validation',
      userId: event.userId,
      requiresApproval: false,
      priority: RequestPriority.NORMAL,
      metadata: {},
    };

    if (transition.guard && !transition.guard(mockContext, event)) {
      return {
        valid: false,
        error: `Insufficient permissions for ${event.type}`,
      };
    }

    return {
      valid: true,
      nextState: transition.to,
    };
  }

  getAvailableActions(
    currentState: RequestStatus,
    userId: string,
    context?: WorkflowState['context']
  ): Array<{
    action: WorkflowEvent['type'];
    label: string;
    description: string;
    requiresPermission?: string;
  }> {
    const availableTransitions = this.transitions.filter(t => t.from === currentState);
    const actions: Array<{
      action: WorkflowEvent['type'];
      label: string;
      description: string;
      requiresPermission?: string;
    }> = [];

    availableTransitions.forEach(transition => {
      // Basic permission check (would be more sophisticated in production)
      const mockEvent: WorkflowEvent = { type: transition.event, userId };
      const mockContext = context || {
        requestId: 'mock',
        serviceId: 'mock',
        userId,
        requiresApproval: false,
        priority: RequestPriority.NORMAL,
        metadata: {},
      };

      if (!transition.guard || transition.guard(mockContext, mockEvent)) {
        actions.push({
          action: transition.event,
          label: this.getActionLabel(transition.event),
          description: this.getActionDescription(transition.event, transition.to),
          requiresPermission: this.getRequiredPermission(transition.event),
        });
      }
    });

    return actions;
  }

  // ============================================================================
  // RULE ENGINE
  // ============================================================================

  private async applyRules(
    state: WorkflowState
  ): Promise<Array<{ type: string; parameters: Record<string, any> }>> {
    const actions: Array<{ type: string; parameters: Record<string, any> }> = [];

    for (const rule of this.rules) {
      try {
        if (rule.condition(state.context)) {
          logger.info('Workflow rule triggered', {
            rule: rule.name,
            requestId: state.context.requestId,
          });

          actions.push(...rule.actions);
        }
      } catch (error) {
        logger.error('Error applying workflow rule', {
          rule: rule.name,
          requestId: state.context.requestId,
        }, error as Error);
      }
    }

    return actions;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private findTransition(from: RequestStatus, event: WorkflowEvent): StateTransition | undefined {
    return this.transitions.find(t => t.from === from && t.event === event.type);
  }

  private canApprove(context: WorkflowState['context'], userId: string): boolean {
    // Simplified permission check - in production, this would check user roles
    return context.userId !== userId; // Can't approve your own request
  }

  private canAssign(context: WorkflowState['context'], userId: string): boolean {
    // Simplified - would check for manager/admin role
    return true;
  }

  private canStart(context: WorkflowState['context'], userId: string): boolean {
    return context.assignedTo === userId || !context.assignedTo;
  }

  private canComplete(context: WorkflowState['context'], userId: string): boolean {
    return context.assignedTo === userId;
  }

  private canHold(context: WorkflowState['context'], userId: string): boolean {
    return context.assignedTo === userId || context.userId === userId;
  }

  private canResume(context: WorkflowState['context'], userId: string): boolean {
    return context.assignedTo === userId || context.userId === userId;
  }

  private canCancel(context: WorkflowState['context'], userId: string): boolean {
    return context.userId === userId || context.assignedTo === userId;
  }

  private getActionLabel(action: WorkflowEvent['type']): string {
    const labels = {
      SUBMIT: 'Submit Request',
      APPROVE: 'Approve',
      REJECT: 'Reject',
      ASSIGN: 'Assign',
      START: 'Start Work',
      COMPLETE: 'Complete',
      CANCEL: 'Cancel',
      HOLD: 'Put on Hold',
      RESUME: 'Resume',
    };
    return labels[action] || action;
  }

  private getActionDescription(action: WorkflowEvent['type'], nextState: RequestStatus): string {
    const descriptions = {
      SUBMIT: 'Submit the service request for processing',
      APPROVE: `Approve the request (moves to ${nextState})`,
      REJECT: 'Reject the service request',
      ASSIGN: 'Assign to a service provider',
      START: 'Begin working on the request',
      COMPLETE: 'Mark the request as completed',
      CANCEL: 'Cancel the service request',
      HOLD: 'Temporarily pause the request',
      RESUME: 'Resume work on the request',
    };
    return descriptions[action] || `Perform ${action}`;
  }

  private getRequiredPermission(action: WorkflowEvent['type']): string | undefined {
    const permissions = {
      APPROVE: 'service.approve',
      REJECT: 'service.approve',
      ASSIGN: 'service.assign',
    };
    return permissions[action];
  }

  // ============================================================================
  // WORKFLOW ANALYTICS
  // ============================================================================

  async getWorkflowMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTransitions: number;
    transitionsByType: Record<string, number>;
    averageProcessingTime: Record<RequestStatus, number>;
    bottlenecks: Array<{
      state: RequestStatus;
      averageTime: number;
      requestCount: number;
    }>;
    ruleEffectiveness: Array<{
      ruleName: string;
      triggerCount: number;
      successRate: number;
    }>;
  }> {
    // This would integrate with actual database queries in production
    // For now, return mock data to demonstrate the structure
    return {
      totalTransitions: 0,
      transitionsByType: {},
      averageProcessingTime: {} as Record<RequestStatus, number>,
      bottlenecks: [],
      ruleEffectiveness: [],
    };
  }
}

export const serviceWorkflowService = new ServiceWorkflowService();