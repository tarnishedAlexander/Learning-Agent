import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { GestionAcademicaModule } from './modules/gestion_academica/gestion_academica.module';
@Module({ imports: [PrismaModule, RbacModule,GestionAcademicaModule] })
export class AppModule {}
