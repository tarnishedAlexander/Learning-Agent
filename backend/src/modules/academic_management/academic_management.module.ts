import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CLASSES_REPO, ENROLLMENT_REPO } from './tokens';
import { STUDENT_REPO } from './tokens';
import { USER_REPO } from './tokens';
import { CreateClassUseCase } from './application/commands/create-clase.usecase';
import { CreateStudentUseCase } from './application/commands/create-student.usecase';
import { CreateStudentProfileUseCase } from './application/commands/create-student-profile.usecase';
import { CreateUserUseCase } from './application/commands/create-user.usecase';
import { ClassesPrismaRepository } from './infrastructure/persistence/classes.prisma.repository';
import { StudentPrismaRepository } from './infrastructure/persistence/student.prisma.repository';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma.repository';
import { AcademicManagementController } from './infrastructure/http/academic_management.controller';
import { ListClassesUseCase } from './application/queries/list-classes.usecase';
import { ListStudentsUseCase } from './application/queries/list-student.usecase';
import { EnrollmentPrismaRepository } from './infrastructure/persistence/enrollment.prisma.repository';
import { GetClassesByStudentUseCase } from './application/queries/get-classes-by-student.usecase';
import { GetStudentsByClassUseCase } from './application/queries/get-students-by-class.usecase';
import { CreateEnrollmentUseCase } from './application/commands/create-enrollment.usecase';
import { GetClassByIdUseCase } from './application/queries/get-class-by-id.usecase';
import { EnrollSingleStudentUseCase } from './application/commands/enroll-sigle-student.usecase';
import { EnrollGroupStudentUseCase } from './application/commands/enroll-group-students.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicManagementController],
  providers: [
    {provide: CLASSES_REPO,  useClass: ClassesPrismaRepository }  ,
    {provide: STUDENT_REPO,  useClass: StudentPrismaRepository}  ,
    {provide: USER_REPO,  useClass: UserPrismaRepository}  ,
    {provide: ENROLLMENT_REPO, useClass: EnrollmentPrismaRepository},
    ListClassesUseCase,
    ListStudentsUseCase,
    GetClassByIdUseCase,
    GetClassesByStudentUseCase,
    GetStudentsByClassUseCase,
    CreateClassUseCase,
    CreateStudentUseCase,
    CreateEnrollmentUseCase,
    CreateUserUseCase,
    CreateStudentProfileUseCase,
    EnrollSingleStudentUseCase,
    EnrollGroupStudentUseCase,
  ],
})
export class AcademicManagementModule {}