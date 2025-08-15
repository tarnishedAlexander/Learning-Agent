import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateClassUseCase } from '../../application/commands/create-clase.usecase';
import { CreateClassDto } from './dtos/create-classes.dto';
import { ListClassesUseCase } from '../../application/queries/list-classes.usecase';

@Controller('gestiona_academica')
export class Gestion_academicaController{
    constructor(
        private readonly createClasses: CreateClassUseCase,
        private readonly listClasses: ListClassesUseCase
    ) {}
    @Post('classes')
    createClassEndpoint(@Body() dto: CreateClassDto) {
      return this.createClasses.execute(dto);
    }
    @Get('classes')
    listClassesEndPoint(){
        return this.listClasses.execute();
    }
    

}