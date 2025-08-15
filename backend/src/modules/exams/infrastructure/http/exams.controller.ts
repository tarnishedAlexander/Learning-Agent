import { Body, Controller, Post, UsePipes, ValidationPipe, HttpCode } from '@nestjs/common';
import { CreateExamDto } from './dtos/create-exam.dto';
import { CreateExamCommand, CreateExamCommandHandler } from '../../application/commands/create-exam.command';

@Controller('exams')
export class ExamsController {
  constructor(private readonly createExamHandler: CreateExamCommandHandler) {}

  @Post()
  @HttpCode(200) //fuerza codigo 200 de confirmacion
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() dto: CreateExamDto) {
    const command = new CreateExamCommand(
      dto.subject,
      dto.difficulty,
      dto.attempts,
      dto.totalQuestions,
      dto.timeMinutes,
      dto.reference ?? null,
    );

    const exam = await this.createExamHandler.execute(command);
    return { ok: true, data: exam.toJSON() };
  }
}
