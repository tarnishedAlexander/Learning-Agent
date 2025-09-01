import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { DocumentsModule } from './modules/repository_documents/documents.module';
import { AcademicManagementModule } from './modules/academic_management/academic_management.module';
import { ExamsModule } from './modules/exams/exams.module';
import { AiConfigService } from './core/ai/ai.config';
import { InfrastructureModule } from './modules/repository_documents/infrastructure/infrastructure.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    IdentityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AcademicManagementModule,
    ExamsModule,
    DocumentsModule,
    InfrastructureModule
  ],
  controllers: [],
  providers: [AiConfigService],
})
export class AppModule {}
