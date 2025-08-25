import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './modules/repository_documents/documents.module';
import { AcademicManagementModule } from './modules/academic_management/academic_management.module';
import { ExamsModule } from './modules/exams/exams.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    IdentityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AcademicManagementModule,
    ExamsModule,
    DocumentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
