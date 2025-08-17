import { Body, Controller, Post, UsePipes, ValidationPipe, HttpCode, BadGatewayException, BadRequestException } from '@nestjs/common';
import { CreateExamDto } from './dtos/create-exam.dto';
import { CreateExamCommand, CreateExamCommandHandler } from '../../application/commands/create-exam.command';
import { GenerateQuestionsCommand, GenerateQuestionsCommandHandler } from '../../application/commands/generate-questions.command';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly createExamHandler: CreateExamCommandHandler,
    private readonly generateQuestionsHandler: GenerateQuestionsCommandHandler,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))
  async createWithQuestions(@Body() dto: CreateExamDto) {
    const genCmd = new GenerateQuestionsCommand(
      dto.subject,
      dto.difficulty as 'fácil' | 'medio' | 'difícil',
      dto.totalQuestions,
      dto.reference ?? null,
    );

    let questions: any[];
    try {
      questions = await this.generateQuestionsHandler.execute(genCmd);
    } catch (e: any) {
      throw new BadGatewayException(e?.message ?? 'No se pudieron generar preguntas con la IA.');
    }

    const createCmd = new CreateExamCommand(
      dto.subject,
      dto.difficulty as 'fácil' | 'medio' | 'difícil',
      dto.attempts,
      dto.totalQuestions,
      dto.timeMinutes,
      dto.reference ?? null,
    );
    const exam = await this.createExamHandler.execute(createCmd);

    return { ok: true, data: { exam: exam.toJSON(), questions } };
  }

}
