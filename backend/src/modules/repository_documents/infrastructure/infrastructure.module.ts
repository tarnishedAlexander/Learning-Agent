// infrastructure/infrastructure.module.ts (nuevo archivo)

import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './context/request-context.service';
import { CustomLogger } from './logging/custom-logger.service';

@Global() // Hacemos el módulo global para que sus providers estén disponibles en toda la app
@Module({
  providers: [RequestContextService, CustomLogger],
  exports: [RequestContextService, CustomLogger],
})
export class InfrastructureModule {}