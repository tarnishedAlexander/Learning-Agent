import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateExamCommand, CreateExamCommandHandler } from '../../application/commands/create-exam.command';
import { CreateExamDto } from './dtos/create-exam.dto';
import { GenerateQuestionsDto } from './dtos/generate-questions.dto';
import { GenerateQuestionsCommand, GenerateQuestionsCommandHandler } from '../../application/commands/generate-questions.command';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly createExamHandler: CreateExamCommandHandler,
    private readonly generateQuestionsHandler: GenerateQuestionsCommandHandler,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() dto: CreateExamDto) {
    const cmd = new CreateExamCommand(
      dto.subject, dto.difficulty, dto.attempts,
      dto.totalQuestions, dto.timeMinutes, dto.reference ?? null,
    );
    const exam = await this.createExamHandler.execute(cmd);
    return { ok: true, data: exam.toJSON() };
  }

  @Post('questions')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async generate(@Body() dto: GenerateQuestionsDto) {
    const cmd = new GenerateQuestionsCommand(
      dto.subject,
      dto.difficulty,
      dto.totalQuestions,
      dto.reference ?? null,
      dto.preferredType ?? 'mixed',
    );
    try {
      const questions = await this.generateQuestionsHandler.execute(cmd);
      return { ok: true, data: questions };
    } catch (e: any) {
      // 502 si falla proveedor IA; 400 si validación de dominio
      const message = e?.message ?? 'Error interno';
      const status = /JSON válido|AI request failed/.test(message) ? 502 : 400;
      return {
        ok: false,
        error: { code: status, message },
      };
    }
  }
}
