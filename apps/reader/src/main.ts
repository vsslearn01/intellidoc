import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ENV } from '@library/environment';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Catch uncaught exceptions globally
  process.on('uncaughtException', (e) => {
    console.error('Uncaught Exception:', e);
    process.exit(1);
  });

  // Catch unhandled promise rejections globally
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Optionally add event listeners for custom handling
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    void app.close();
  });

  await app.startAllMicroservices();
  await app.listen(ENV.PORT_READER);

  console.log(`Report is running on the port ${ENV.PORT_READER}`);
}

bootstrap().catch((e) => {
  throw e;
});
