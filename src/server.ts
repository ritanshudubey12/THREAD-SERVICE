import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 Thread Service running at http://localhost:${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
});

// Graceful Shutdown
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing server shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
