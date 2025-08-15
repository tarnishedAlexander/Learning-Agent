import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateClassUseCase } from '../../application/commands/create-clase.usecase';
import { CreateStudentProfileDto } from './dtos/create-studentProfile.dto';
import { CreateClassDto } from './dtos/create-classes.dto';
import { ListClassesUseCase } from '../../application/queries/list-classes.usecase';
import { ListStudentsUseCase } from '../../application/queries/list-student.usecase';
import { CreateStudentProfileUseCase } from '../../application/commands/create-student-profile.usecase';

@Controller('gestion_academica')
export class Gestion_academicaController{
    constructor(
        private readonly createClasses: CreateClassUseCase,
        private readonly createProfileStudent: CreateStudentProfileUseCase,
        private readonly listClasses: ListClassesUseCase,
        private readonly listStudents: ListStudentsUseCase,
    ) {}
    @Post('classes')
    createClassEndpoint(@Body() dto: CreateClassDto) {
      return this.createClasses.execute(dto);
    }
    @Get('classes')
    listClassesEndPoint(){
        return this.listClasses.execute();
    }
    @Post('students')
    createStudentEndpoint(@Body() dto: CreateStudentProfileDto) {
      return this.createProfileStudent.execute(dto);
    }
    @Get('students')
    listStudentEndPoint(){
        return this.listStudents.execute();
    }

}