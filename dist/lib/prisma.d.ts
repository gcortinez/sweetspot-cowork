import { PrismaClient } from "@prisma/client";
interface ExtendedPrismaClient extends PrismaClient {
    $queryStats: {
        count: number;
        totalTime: number;
        slowQueries: Array<{
            query: string;
            duration: number;
            timestamp: Date;
        }>;
    };
}
declare let prisma: ExtendedPrismaClient;
declare global {
    var __prisma: ExtendedPrismaClient | undefined;
}
export declare function checkDatabaseConnection(): Promise<boolean>;
export declare function getDatabaseStats(): {
    queryCount: number;
    totalQueryTime: number;
    averageQueryTime: number;
    slowQueryCount: number;
    recentSlowQueries: {
        query: string;
        duration: number;
        timestamp: Date;
    }[];
};
export declare function disconnectDatabase(): Promise<void>;
export declare function withTransaction<T>(callback: (tx: PrismaClient) => Promise<T>, options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}): Promise<T>;
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare function paginate<T>(model: any, options: PaginationOptions, where?: any, include?: any): Promise<PaginationResult<T>>;
export declare function softDelete(model: any, id: string, userId?: string): Promise<any>;
export declare function restore(model: any, id: string): Promise<any>;
export declare function safeUpsert<T>(model: any, where: any, create: any, update: any): Promise<T>;
export declare function batchUpdate<T>(model: any, updates: Array<{
    where: any;
    data: any;
}>): Promise<T[]>;
export declare function checkTableHealth(tableName: string): Promise<{
    accessible: boolean;
    recordCount?: number;
    error?: string;
}>;
export declare function initializeDatabase(): Promise<void>;
export { prisma };
export default prisma;
//# sourceMappingURL=prisma.d.ts.map