import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainErrorFilter } from 'src/core/prisma/http/domain-error.filter';
import { CustomLogger } from './modules/repository_documents/infrastructure/logging/custom-logger.service';
import { RequestContextService } from './modules/repository_documents/infrastructure/context/request-context.service';
import { CorrelationIdMiddleware } from './modules/repository_documents/infrastructure/http/correlation-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestContextService = app.get(RequestContextService);
  const customLogger = app.get(CustomLogger);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainErrorFilter()); // Handle DomainError globally,(en el futuro el dominio lanza DomainErrors)

  app.enableShutdownHooks();

  app.useLogger(customLogger);
  const correlationIdMiddleware = new CorrelationIdMiddleware(
    requestContextService,
  );
  app.use((req, res, next) => correlationIdMiddleware.use(req, res, next));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
