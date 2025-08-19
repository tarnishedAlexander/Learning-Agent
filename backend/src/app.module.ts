import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { DocumentModule } from './modules/repository/document.module';
import { GestionAcademicaModule } from './modules/gestion_academica/gestion_academica.module';
import { ExamsModule } from './modules/exams/exams.module';
import { AiConfigService } from './core/ai/ai.config';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    IdentityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GestionAcademicaModule,
    ExamsModule,
    DocumentModule,
  ],
  controllers: [],
  providers: [AiConfigService],
})
export class AppModule {}
