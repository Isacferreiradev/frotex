import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        process.exit(1);
    }

    console.log('⏳ Connecting to database for migrations...');
    const pool = new pg.Pool({
        connectionString,
        ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false
    });

    const db = drizzle(pool);

    console.log('⏳ Running migrations from folder:', path.join(__dirname, 'migrations'));

    try {
        await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
