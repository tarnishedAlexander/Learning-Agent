import { Controller, Post, Put, Body, Param, HttpCode, Req } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

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
import { AddExamQuestionDto } from './dtos/add-exam-question.dto';
import { AddExamQuestionCommand } from '../../application/commands/add-exam-question.command';
import { AddExamQuestionCommandHandler } from '../../application/commands/add-exam-question.handler';
import { UpdateExamQuestionDto } from './dtos/update-exam-question.dto';
import { UpdateExamQuestionCommand } from '../../application/commands/update-exam-question.command';
import { UpdateExamQuestionCommandHandler } from '../../application/commands/update-exam-question.handler';
import { ApproveExamCommand } from '../../application/commands/approve-exam.command';
import { ApproveExamCommandHandler } from '../../application/commands/approve-exam.handler';

import {
  responseSuccess,
  responseBadRequest,
} from 'src/shared/handler/http.handler';

function sumDistribution(d?: { multiple_choice: number; true_false: number; open_analysis: number; open_exercise: number; }) {
  if (!d) return 0;
  return (d.multiple_choice ?? 0)
      + (d.true_false ?? 0)
      + (d.open_analysis ?? 0)
      + (d.open_exercise ?? 0);
}

const cid = (req: Request) => req.header('x-correlation-id') ?? randomUUID();
const pathOf = (req: Request) => (req as any).originalUrl || req.url || '';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly createExamHandler: CreateExamCommandHandler,
    private readonly generateQuestionsHandler: GenerateQuestionsCommandHandler,
    private readonly generateExamHandler: GenerateExamUseCase,
    private readonly addExamQuestionHandler: AddExamQuestionCommandHandler,
    private readonly updateExamQuestionHandler: UpdateExamQuestionCommandHandler,
    private readonly approveExamHandler: ApproveExamCommandHandler,
  ) {}

  @Post(':id/questions')
  async addQuestion(
    @Param('id') id: string,
    @Body() dto: AddExamQuestionDto,
    @Req() req: Request,
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
    return responseSuccess(cid(req), created, 'Question added to exam', pathOf(req));
  }

  @Post()
  @HttpCode(200)
  async create(@Body() dto: CreateExamDto, @Req() req: Request) {
    const sum = sumDistribution(dto.distribution);
    if (dto.totalQuestions <= 0) {
      return responseBadRequest('totalQuestions debe ser > 0.', cid(req), 'Error en validación', pathOf(req));
    }
    if (sum !== dto.totalQuestions) {
      return responseBadRequest('La suma de distribution debe ser igual a totalQuestions.', cid(req), 'Error en validación', pathOf(req));
    }

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
    return responseSuccess(cid(req), exam, 'Exam created successfully', pathOf(req));
  }

  @Post('questions')
  @HttpCode(200)
  async generate(@Body() dto: GenerateQuestionsDto, @Req() req: Request) {
    const sum = sumDistribution(dto.distribution);
    if (dto.totalQuestions <= 0) {
      return responseBadRequest('totalQuestions debe ser > 0.', cid(req), 'Error en validación', pathOf(req));
    }
    if (sum !== dto.totalQuestions) {
      return responseBadRequest('La suma de distribution debe ser igual a totalQuestions.', cid(req), 'Error en validación', pathOf(req));
    }

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

    return responseSuccess(cid(req), { questions: grouped }, 'Questions generated successfully', pathOf(req));
  }

  @Post('generate-exam')
  async generateExam(@Body() dto: GenerateExamInput, @Req() req: Request) {
    const exam = await this.generateExamHandler.execute(dto);
    return responseSuccess(cid(req), exam, 'Exam generated successfully', pathOf(req));
  }

  @Put('questions/:id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateExamQuestionDto,
    @Req() req: Request
  ) {
    const updated = await this.updateExamQuestionHandler.execute(new UpdateExamQuestionCommand(id, dto));
    return responseSuccess(cid(req), updated, 'Question updated successfully', pathOf(req));
  }

  @Post(':id/approve')
  @HttpCode(200)
  async approveExam(@Param('id') id: string, @Req() req: Request) {
    const res = await this.approveExamHandler.execute(new ApproveExamCommand(id));
    return responseSuccess(cid(req), res, 'Exam approved successfully', pathOf(req));
  }
}