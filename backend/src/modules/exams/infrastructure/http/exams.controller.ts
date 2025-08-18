import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateExamDto } from './dtos/create-exam.dto';
import { GenerateQuestionsDto } from './dtos/generate-questions.dto';
import { CreateExamCommand, CreateExamCommandHandler } from '../../application/commands/create-exam.command';
import { GenerateQuestionsCommand, GenerateQuestionsCommandHandler } from '../../application/commands/generate-questions.command';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly createExamHandler: CreateExamCommandHandler,
    private readonly generateQuestionsHandler: GenerateQuestionsCommandHandler,
  ) {}

  @Post()
  @HttpCode(200)
  async create(@Body() dto: CreateExamDto) {
    const createCmd = new CreateExamCommand(
      dto.subject,
      dto.difficulty,
      dto.attempts,
      dto.totalQuestions,
      dto.timeMinutes,
      dto.reference ?? null,
      dto.distribution ?? undefined, 
    );

    const exam = await this.createExamHandler.execute(createCmd);
    return { ok: true, data: exam };
  }

  @Post('questions')
  @HttpCode(200)
  async generate(@Body() dto: GenerateQuestionsDto) {
    const genCmd = new GenerateQuestionsCommand(
      dto.subject,
      dto.difficulty,
      dto.totalQuestions,
      dto.reference ?? null,
      dto.preferredType ?? 'mixed',
      dto.distribution ?? undefined, 
    );

    const flat = await this.generateQuestionsHandler.execute(genCmd);

    const grouped = {
      multiple_choice: flat.filter((q: any) => q.type === 'multiple_choice'),
      true_false:      flat.filter((q: any) => q.type === 'true_false'),
      open_analysis:   flat.filter((q: any) => q.type === 'open_analysis'),
      open_exercise:   flat.filter((q: any) => q.type === 'open_exercise'),
    };

    return { ok: true, data: { /* exam, */ questions: grouped, /* questionsFlat: flat */ } };
  }
}