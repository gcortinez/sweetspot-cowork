"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWorkflowService = exports.ServiceWorkflowService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class ServiceWorkflowService {
    transitions = [];
    rules = [];
    constructor() {
        this.initializeTransitions();
        this.initializeRules();
    }
    initializeTransitions() {
        this.transitions = [
            {
                from: 'PENDING',
                to: 'APPROVED',
                event: 'SUBMIT',
                guard: (context) => !context.requiresApproval,
            },
            {
                from: 'PENDING',
                to: 'PENDING',
                event: 'SUBMIT',
                guard: (context) => context.requiresApproval,
            },
            {
                from: 'PENDING',
                to: 'APPROVED',
                event: 'APPROVE',
                guard: (context, event) => this.canApprove(context, event.userId),
            },
            {
                from: 'PENDING',
                to: 'REJECTED',
                event: 'REJECT',
                guard: (context, event) => this.canApprove(context, event.userId),
            },
            {
                from: 'APPROVED',
                to: 'IN_PROGRESS',
                event: 'ASSIGN',
                guard: (context, event) => this.canAssign(context, event.userId),
            },
            {
                from: 'APPROVED',
                to: 'IN_PROGRESS',
                event: 'START',
                guard: (context, event) => this.canStart(context, event.userId),
            },
            {
                from: 'IN_PROGRESS',
                to: 'COMPLETED',
                event: 'COMPLETE',
                guard: (context, event) => this.canComplete(context, event.userId),
            },
            {
                from: 'IN_PROGRESS',
                to: 'ON_HOLD',
                event: 'HOLD',
                guard: (context, event) => this.canHold(context, event.userId),
            },
            {
                from: 'ON_HOLD',
                to: 'IN_PROGRESS',
                event: 'RESUME',
                guard: (context, event) => this.canResume(context, event.userId),
            },
            {
                from: 'PENDING',
                to: 'CANCELLED',
                event: 'CANCEL',
                guard: (context, event) => this.canCancel(context, event.userId),
            },
            {
                from: 'APPROVED',
                to: 'CANCELLED',
                event: 'CANCEL',
                guard: (context, event) => this.canCancel(context, event.userId),
            },
            {
                from: 'IN_PROGRESS',
                to: 'CANCELLED',
                event: 'CANCEL',
                guard: (context, event) => this.canCancel(context, event.userId),
            },
            {
                from: 'ON_HOLD',
                to: 'CANCELLED',
                event: 'CANCEL',
                guard: (context, event) => this.canCancel(context, event.userId),
            },
        ];
    }
    initializeRules() {
        this.rules = [
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
            {
                name: 'URGENT_PRIORITY_ESCALATION',
                description: 'Escalate urgent requests if not processed within 1 hour',
                condition: (context) => {
                    const createdAt = new Date(context.metadata.createdAt);
                    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
                    return context.priority === client_1.RequestPriority.URGENT && hoursSinceCreation > 1;
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
            {
                name: 'OVERDUE_NOTIFICATION',
                description: 'Notify about overdue requests',
                condition: (context) => {
                    const scheduledDelivery = context.metadata.scheduledDeliveryTime;
                    if (!scheduledDelivery)
                        return false;
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
    async processEvent(currentState, event) {
        try {
            const transition = this.findTransition(currentState.value, event);
            if (!transition) {
                return {
                    newState: currentState,
                    actions: [],
                    success: false,
                    error: `No valid transition from ${currentState.value} with event ${event.type}`,
                };
            }
            if (transition.guard && !transition.guard(currentState.context, event)) {
                return {
                    newState: currentState,
                    actions: [],
                    success: false,
                    error: `Transition guard failed for ${event.type} from ${currentState.value}`,
                };
            }
            const newState = {
                value: transition.to,
                context: {
                    ...currentState.context,
                    ...(event.data || {}),
                },
            };
            if (transition.action) {
                await transition.action(newState.context, event);
            }
            const ruleActions = await this.applyRules(newState);
            logger_1.logger.info('Workflow transition processed', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to process workflow event', {
                currentState: currentState.value,
                event: event.type,
                requestId: currentState.context.requestId,
            }, error);
            return {
                newState: currentState,
                actions: [],
                success: false,
                error: 'Internal workflow error',
            };
        }
    }
    async validateTransition(currentState, event) {
        const transition = this.findTransition(currentState, event);
        if (!transition) {
            return {
                valid: false,
                error: `No valid transition from ${currentState} with event ${event.type}`,
            };
        }
        const mockContext = {
            requestId: 'validation',
            serviceId: 'validation',
            userId: event.userId,
            requiresApproval: false,
            priority: client_1.RequestPriority.NORMAL,
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
    getAvailableActions(currentState, userId, context) {
        const availableTransitions = this.transitions.filter(t => t.from === currentState);
        const actions = [];
        availableTransitions.forEach(transition => {
            const mockEvent = { type: transition.event, userId };
            const mockContext = context || {
                requestId: 'mock',
                serviceId: 'mock',
                userId,
                requiresApproval: false,
                priority: client_1.RequestPriority.NORMAL,
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
    async applyRules(state) {
        const actions = [];
        for (const rule of this.rules) {
            try {
                if (rule.condition(state.context)) {
                    logger_1.logger.info('Workflow rule triggered', {
                        rule: rule.name,
                        requestId: state.context.requestId,
                    });
                    actions.push(...rule.actions);
                }
            }
            catch (error) {
                logger_1.logger.error('Error applying workflow rule', {
                    rule: rule.name,
                    requestId: state.context.requestId,
                }, error);
            }
        }
        return actions;
    }
    findTransition(from, event) {
        return this.transitions.find(t => t.from === from && t.event === event.type);
    }
    canApprove(context, userId) {
        return context.userId !== userId;
    }
    canAssign(context, userId) {
        return true;
    }
    canStart(context, userId) {
        return context.assignedTo === userId || !context.assignedTo;
    }
    canComplete(context, userId) {
        return context.assignedTo === userId;
    }
    canHold(context, userId) {
        return context.assignedTo === userId || context.userId === userId;
    }
    canResume(context, userId) {
        return context.assignedTo === userId || context.userId === userId;
    }
    canCancel(context, userId) {
        return context.userId === userId || context.assignedTo === userId;
    }
    getActionLabel(action) {
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
    getActionDescription(action, nextState) {
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
    getRequiredPermission(action) {
        const permissions = {
            APPROVE: 'service.approve',
            REJECT: 'service.approve',
            ASSIGN: 'service.assign',
        };
        return permissions[action];
    }
    async getWorkflowMetrics(tenantId, startDate, endDate) {
        return {
            totalTransitions: 0,
            transitionsByType: {},
            averageProcessingTime: {},
            bottlenecks: [],
            ruleEffectiveness: [],
        };
    }
}
exports.ServiceWorkflowService = ServiceWorkflowService;
exports.serviceWorkflowService = new ServiceWorkflowService();
//# sourceMappingURL=serviceWorkflowService.js.map