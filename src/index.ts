import dotenv from 'dotenv';
import { createServer, startServer } from './server';
import { createWhatsAppClient, initializeWhatsAppClient } from './bot/whatsapp';
import { handleIncomingMessage } from './bot/messageHandler';
import { setWhatsAppClient } from './payment/webhook';
import { closePool } from './database/connection';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'MERCADOPAGO_ACCESS_TOKEN',
  'WEBHOOK_URL',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(
    { missingEnvVars },
    'Missing required environment variables. Please check your .env file.'
  );
  process.exit(1);
}

async function main() {
  try {
    logger.info('🚀 Starting Helixon WhatsApp Bot...');

    // Create and start Express server
    const app = createServer();
    startServer(app);

    // Create WhatsApp client
    const whatsappClient = createWhatsAppClient();

    // Register WhatsApp client with webhook handler
    setWhatsAppClient(whatsappClient);

    // Register message handler
    whatsappClient.on('message', async (msg) => {
      try {
        await handleIncomingMessage(msg);
      } catch (error) {
        logger.error({ error }, 'Error in message handler');
      }
    });

    // Initialize WhatsApp client
    await initializeWhatsAppClient(whatsappClient);

    logger.info('✅ Helixon WhatsApp Bot is fully operational!');
    logger.info('📱 Waiting for messages...');
  } catch (error) {
    logger.error({ error }, 'Failed to start application');
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    // Close database pool
    await closePool();
    logger.info('Database connections closed');

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Start the application
main();
