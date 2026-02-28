import pg from 'pg';

async function run() {
    const DATABASE_URL = 'postgresql://aluga_admin:AlugaFacil@2026@localhost:5432/alugafacil';
    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('Connecting...');
        const client = await pool.connect();

        console.log('Tables:');
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name));

        console.log('\nColumns in customers:');
        const customersCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'");
        console.log(customersCols.rows.map(r => r.column_name));

        console.log('\nColumns in tools:');
        const toolsCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tools'");
        console.log(toolsCols.rows.map(r => r.column_name));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
