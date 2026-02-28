import { db } from '../db';
import { activityLogs } from '../db/schema';

export type ActivityAction =
    | 'CREATE_TOOL' | 'UPDATE_TOOL' | 'DELETE_TOOL'
    | 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER' | 'DELETE_CUSTOMER'
    | 'CREATE_RENTAL' | 'RETURN_RENTAL' | 'CANCEL_RENTAL'
    | 'ADD_PAYMENT' | 'ADD_MAINTENANCE'
    | 'LOGIN' | 'LOGOUT';

export interface LogActivityParams {
    tenantId: string;
    userId: string;
    action: ActivityAction;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
    try {
        await db.insert(activityLogs).values({
            tenantId: params.tenantId,
            userId: params.userId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            details: params.details,
            ipAddress: params.ipAddress,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Não lançamos erro para não quebrar a transação principal
    }
}
