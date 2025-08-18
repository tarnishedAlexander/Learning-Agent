import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { GestionAcademicaModule } from './modules/gestion_academica/gestion_academica.module';
import { ExamsModule } from './modules/exams/exams.module';

@Module({ imports: [
  PrismaModule, 
  RbacModule,
  IdentityModule,
  GestionAcademicaModule,
  ExamsModule
]})

export class AppModule {}
