import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateClassUseCase } from '../../application/commands/create-clase.usecase';
import { CreateStudentProfileDto } from './dtos/create-studentProfile.dto';
import { CreateClassDto } from './dtos/create-classes.dto';
import { ListClassesUseCase } from '../../application/queries/list-classes.usecase';
import { ListStudentsUseCase } from '../../application/queries/list-student.usecase';
import { CreateStudentProfileUseCase } from '../../application/commands/create-student-profile.usecase';
import { CreateEnrollmentUseCase } from '../../application/commands/create-enrollment.usecase';
import { CreateEnrollmentDto } from './dtos/create-enrollment.dto';
import { GetClassesByStudentUseCase } from '../../application/queries/get-classes-by-student.usecase';
import { GetStudentsByClassUseCase } from '../../application/queries/get-students-by-class.usecase';

@Controller('gestion_academica')
export class Gestion_academicaController {
  constructor(
    private readonly listClasses: ListClassesUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly getClassesByStudent: GetClassesByStudentUseCase,
    private readonly getStudentsByClass: GetStudentsByClassUseCase,
    private readonly createClasses: CreateClassUseCase,
    private readonly createProfileStudent: CreateStudentProfileUseCase,
    private readonly createEnrollment: CreateEnrollmentUseCase,
  ) { }
  @Get('classes')
  listClassesEndPoint() {
    return this.listClasses.execute();
  }
  @Get('students')
  listStudentEndPoint() {
    return this.listStudents.execute();
  }
  @Get('classes/by-student/:studentId')
  getClassesByStudentEndpoint(@Param('studentId') studentId: string) {
    return this.getClassesByStudent.execute(studentId);
  }
  @Get('students/by-class/:classId')
  getStudentsByClassEndpoint(@Param('classId') classId: string) {
    return this.getStudentsByClass.execute(classId);
  }

  @Post('classes')
  createClassEndpoint(@Body() dto: CreateClassDto) {
    return this.createClasses.execute(dto);
  }
  @Post('students')
  createStudentEndpoint(@Body() dto: CreateStudentProfileDto) {
    return this.createProfileStudent.execute(dto);
  }
  @Post('enrollments')
  createEnrollmentEndpoint(@Body() dto: CreateEnrollmentDto) {
    return this.createEnrollment.execute(dto);
  }

}