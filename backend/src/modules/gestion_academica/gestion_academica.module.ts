import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CLASSES_REPO } from './tokens';
import { STUDENT_REPO } from './tokens';
import { USER_REPO } from './tokens';
import { CreateClassUseCase } from './application/commands/create-clase.usecase';
import { CreateStudentUseCase } from './application/commands/create-student.usecase';
import { CreateStudentProfileUseCase } from './application/commands/create-student-profile.usecase';
import { CreateUserUseCase } from './application/commands/create-user.usecase';
import { ClassesPrismaRepository } from './infrastructure/persistence/classes.prisma.repository';
import { StudentPrismaRepository } from './infrastructure/persistence/student.prisma.repository';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma.repository';
import { Gestion_academicaController } from './infrastructure/http/gestion_academica.controller';
import { ListClassesUseCase } from './application/queries/list-classes.usecase';
import { ListStudentsUseCase } from './application/queries/list-student.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [Gestion_academicaController],
  providers: [
    {provide: CLASSES_REPO,  useClass: ClassesPrismaRepository }  ,
    {provide: STUDENT_REPO,  useClass: StudentPrismaRepository}  ,
    {provide: USER_REPO,  useClass: UserPrismaRepository}  ,
    CreateClassUseCase,
    ListClassesUseCase,
    ListStudentsUseCase,
    CreateStudentUseCase,
    CreateUserUseCase,
    CreateStudentProfileUseCase,
  ],
})
export class GestionAcademicaModule {}