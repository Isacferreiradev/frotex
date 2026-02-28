import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';
import logger from '../utils/logger';

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle DB client', err);
});

export const db = drizzle(pool, { schema });

/**
 * Set the app.current_tenant session variable for RLS.
 * Must be called before any tenant-scoped query.
 */
export async function setTenantContext(client: any, tenantId: string) {
    await client.query(`SET app.current_tenant = '${tenantId}'`);
}

export { pool };
