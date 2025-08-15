import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CLASSES_REPO } from './tokens';
import { CreateClassUseCase } from './application/commands/create-clase.usecase';
import { ClassesPrismaRepository } from './infrastructure/persistence/classes.prisma.repository';
// import { RbacController } from './infrastructure/http/rbac.controller';
import { Gestion_academicaController } from './infrastructure/http/gestion_academica.controller';
import { ListClassesUseCase } from './application/queries/list-classes.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [Gestion_academicaController],
  providers: [
    {provide: CLASSES_REPO,  useClass: ClassesPrismaRepository }  ,
    // { provide: PERM_REPO, useClass: PermissionPrismaRepository },
    CreateClassUseCase,
    ListClassesUseCase,
  ],
})
export class GestionAcademicaModule {}