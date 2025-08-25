import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { DocumentsModule } from './modules/repository_documents/documents.module';
import { AcademicManagementModule } from './modules/academic_management/academic_management.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiConfigService } from './core/ai/ai.config';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    IdentityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AcademicManagementModule,
    ExamsModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [AiConfigService],
})
export class AppModule {}

