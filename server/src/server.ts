import app from './app';
import { env } from './config/env';
import { pool } from './db';
import logger from './utils/logger';

const server = app.listen(env.PORT, () => {
    logger.info(`🚀 AlugaFácil Pro API running on http://localhost:${env.PORT}`);
    logger.info(`📊 Environment: ${env.NODE_ENV}`);
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing gracefully...');
    server.close(async () => {
        await pool.end();
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
});
