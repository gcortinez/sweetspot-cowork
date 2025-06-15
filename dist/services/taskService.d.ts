import { TaskPriority, TaskStatus } from '@prisma/client';
interface CreateTaskData {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    reminderDate?: string;
    assignedToId?: string;
    leadId?: string;
    clientId?: string;
    opportunityId?: string;
    activityId?: string;
    tags?: string[];
    estimatedHours?: number;
    metadata?: Record<string, any>;
}
interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    reminderDate?: string;
    assignedToId?: string;
    tags?: string[];
    estimatedHours?: number;
    actualHours?: number;
    completedAt?: string;
    metadata?: Record<string, any>;
}
interface TasksQuery {
    page: number;
    limit: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    entityType?: 'LEAD' | 'CLIENT' | 'OPPORTUNITY' | 'ACTIVITY';
    entityId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdue?: boolean;
    searchTerm?: string;
    tags?: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface TaskStats {
    total: number;
    byStatus: Array<{
        status: TaskStatus;
        count: number;
        percentage: number;
    }>;
    byPriority: Array<{
        priority: TaskPriority;
        count: number;
        percentage: number;
    }>;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    completed: number;
    completionRate: number;
    averageCompletionTime: number;
    byAssignee: Array<{
        userId: string;
        userName: string;
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        completionRate: number;
    }>;
    recentTasks: Array<{
        id: string;
        title: string;
        status: TaskStatus;
        priority: TaskPriority;
        assigneeName: string;
        createdAt: Date;
    }>;
}
interface TaskReminder {
    id: string;
    taskId: string;
    taskTitle: string;
    dueDate: Date;
    reminderDate: Date;
    assigneeName: string;
    priority: TaskPriority;
    isOverdue: boolean;
    daysDue: number;
}
declare class TaskService {
    createTask(tenantId: string, createdById: string, data: CreateTaskData): Promise<{
        tenantId: string;
        id: string;
        clientId: string | null;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        dueDate: Date;
        opportunityId: string | null;
        leadId: string | null;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assignedById: string;
    }>;
    getTasks(tenantId: string, query: TasksQuery): Promise<{
        tasks: {
            tenantId: string;
            id: string;
            clientId: string | null;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            assignedToId: string | null;
            description: string | null;
            tags: import("@prisma/client/runtime/library").JsonValue | null;
            dueDate: Date;
            opportunityId: string | null;
            leadId: string | null;
            completedAt: Date | null;
            priority: import(".prisma/client").$Enums.TaskPriority;
            assignedById: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getTaskById(tenantId: string, taskId: string): Promise<{
        tenantId: string;
        id: string;
        clientId: string | null;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        dueDate: Date;
        opportunityId: string | null;
        leadId: string | null;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assignedById: string;
    }>;
    updateTask(tenantId: string, taskId: string, data: UpdateTaskData): Promise<{
        tenantId: string;
        id: string;
        clientId: string | null;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        dueDate: Date;
        opportunityId: string | null;
        leadId: string | null;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assignedById: string;
    }>;
    deleteTask(tenantId: string, taskId: string): Promise<{
        success: boolean;
    }>;
    completeTask(tenantId: string, taskId: string, completedById: string, actualHours?: number): Promise<{
        tenantId: string;
        id: string;
        clientId: string | null;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        dueDate: Date;
        opportunityId: string | null;
        leadId: string | null;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assignedById: string;
    }>;
    getTaskStats(tenantId: string): Promise<TaskStats>;
    getUpcomingReminders(tenantId: string, userId?: string): Promise<TaskReminder[]>;
    bulkUpdateTasks(tenantId: string, taskIds: string[], updates: Partial<UpdateTaskData>): Promise<{
        updatedCount: number;
        success: boolean;
    }>;
    getTasksByTag(tenantId: string, tag: string): Promise<{
        tenantId: string;
        id: string;
        clientId: string | null;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        dueDate: Date;
        opportunityId: string | null;
        leadId: string | null;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assignedById: string;
    }[]>;
    getAllTags(tenantId: string): Promise<{
        tag: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null | undefined;
        count: number;
    }[]>;
}
export declare const taskService: TaskService;
export {};
//# sourceMappingURL=taskService.d.ts.map