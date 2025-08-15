import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CLASSES_REPO } from './tokens';
import { STUDENT_REPO } from './tokens';
import { CreateClassUseCase } from './application/commands/create-clase.usecase';
import { CreateStudentUseCase } from './application/commands/create-student.usecase';
import { ClassesPrismaRepository } from './infrastructure/persistence/classes.prisma.repository';
import { StudentPrismaRepository } from './infrastructure/persistence/student.prisma.repository';
// import { RbacController } from './infrastructure/http/rbac.controller';
import { Gestion_academicaController } from './infrastructure/http/gestion_academica.controller';
import { ListClassesUseCase } from './application/queries/list-classes.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [Gestion_academicaController],
  providers: [
    {provide: CLASSES_REPO,  useClass: ClassesPrismaRepository }  ,
    {provide: STUDENT_REPO,  useClass: StudentPrismaRepository}  ,
    // { provide: PERM_REPO, useClass: PermissionPrismaRepository },
    CreateClassUseCase,
    ListClassesUseCase,
    CreateStudentUseCase,
  ],
})
export class GestionAcademicaModule {}