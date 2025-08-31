import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateExamDto } from './dtos/create-exam.dto';
import { GenerateQuestionsDto } from './dtos/generate-questions.dto';
import {
  CreateExamCommand,
  CreateExamCommandHandler,
} from '../../application/commands/create-exam.command';
import {
  GenerateQuestionsCommand,
  GenerateQuestionsCommandHandler,
} from '../../application/commands/generate-questions.command';
import type { GenerateExamInput } from './dtos/exam.types';
import { GenerateExamUseCase } from '../../application/commands/generate-exam.usecase';
import { Param } from '@nestjs/common';
import { AddExamQuestionDto } from './dtos/add-exam-question.dto';
import { AddExamQuestionCommand } from '../../application/commands/add-exam-question.command';
import { AddExamQuestionCommandHandler } from '../../application/commands/add-exam-question.handler';

function sumDistribution(d?: { multiple_choice: number; true_false: number; open_analysis: number; open_exercise: number; }) {
  if (!d) return 0;
  return (d.multiple_choice ?? 0)
       + (d.true_false ?? 0)
       + (d.open_analysis ?? 0)
       + (d.open_exercise ?? 0);
}

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly createExamHandler: CreateExamCommandHandler,
    private readonly generateQuestionsHandler: GenerateQuestionsCommandHandler,
    private readonly generateExamHandler: GenerateExamUseCase,
    private readonly addExamQuestionHandler: AddExamQuestionCommandHandler,
  ) {}

  @Post(':id/questions')
  async addQuestion(
    @Param('id') id: string,
    @Body() dto: AddExamQuestionDto,
  ) {
    const cmd = new AddExamQuestionCommand(id, dto.position, {
      kind: dto.kind,
      text: dto.text,
      options: dto.options,
      correctOptionIndex: dto.correctOptionIndex,
      correctBoolean: dto.correctBoolean,
      expectedAnswer: dto.expectedAnswer,
    });
    const created = await this.addExamQuestionHandler.execute(cmd);
    return { ok: true, data: created, message: 'Question added to exam' };
  }

  @Post()
  @HttpCode(200)
  async create(@Body() dto: CreateExamDto) {
    const sum = sumDistribution(dto.distribution);
    if (dto.totalQuestions <= 0) throw new BadRequestException('totalQuestions debe ser > 0.');
    if (sum !== dto.totalQuestions) throw new BadRequestException('La suma de distribution debe ser igual a totalQuestions.');

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
    const sum = sumDistribution(dto.distribution);
    if (dto.totalQuestions <= 0) throw new BadRequestException('totalQuestions debe ser > 0.');
    if (sum !== dto.totalQuestions) throw new BadRequestException('La suma de distribution debe ser igual a totalQuestions.');

    const genCmd = new GenerateQuestionsCommand(
      dto.subject,
      dto.difficulty,
      dto.totalQuestions,
      dto.reference ?? null,
      dto.distribution ?? undefined,
    );

    const flat = await this.generateQuestionsHandler.execute(genCmd);

    const grouped = {
      multiple_choice: flat.filter((q: any) => q.type === 'multiple_choice'),
      true_false: flat.filter((q: any) => q.type === 'true_false'),
      open_analysis: flat.filter((q: any) => q.type === 'open_analysis'),
      open_exercise: flat.filter((q: any) => q.type === 'open_exercise'),
    };

    return { ok: true, data: { questions: grouped } };
  }
    
  @Post('generate-exam')
  async generateExam(@Body() dto: GenerateExamInput) {
    return await this.generateExamHandler.execute(dto);
  }
}
