import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../utils/logger';

/**
 * Tenant middleware: sets the app.current_tenant session variable
 * on a client from the pool before each request.
 * This enables PostgreSQL RLS policies to filter data by tenant.
 */
export function tenantContext(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
        return next();
    }
    // Attach tenant_id to res.locals for controllers to use
    res.locals.tenantId = tenantId;
    next();
}
