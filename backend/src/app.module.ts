import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { GestionAcademicaModule } from './modules/gestion_academica/gestion_academica.module';

@Module({ imports: [
  PrismaModule, 
  RbacModule,
  IdentityModule,
  GestionAcademicaModule,
]})

export class AppModule {}
