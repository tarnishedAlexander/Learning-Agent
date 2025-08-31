import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { EXAM_REPO, EXAM_AI_GENERATOR } from './tokens';
import { ExamPrismaRepository } from './infrastructure/persistence/exam.prisma.repository';
import { ExamsController } from './infrastructure/http/exams.controller';
import { CreateExamCommandHandler } from './application/commands/create-exam.command';
import { GenerateQuestionsCommandHandler } from './application/commands/generate-questions.command';
import { AIQuestionGenerator } from './infrastructure/ai/ai-question.generator';
import { AiConfigService } from '../../core/ai/ai.config';
import { LlmModule } from '../llm/llm.module';
import { PromptTemplateModule } from '../prompt-template/prompt-template.module';
import { GenerateExamUseCase } from './application/commands/generate-exam.usecase';
import { ExamQuestionPrismaRepository } from './infrastructure/persistence/exam-question.prisma.repository';
import { EXAM_QUESTION_REPO } from './tokens';
import { AddExamQuestionCommandHandler } from './application/commands/add-exam-question.handler';
import { UpdateExamQuestionCommandHandler } from './application/commands/update-exam-question.handler';
import { ApproveExamCommandHandler } from './application/commands/approve-exam.handler';

@Module({
  imports: [PrismaModule, LlmModule, PromptTemplateModule],
  controllers: [ExamsController],
  providers: [
    // persistencia
    { provide: EXAM_REPO, useClass: ExamPrismaRepository },
    // adaptador IA
    { provide: EXAM_AI_GENERATOR, useClass: AIQuestionGenerator },
    AiConfigService,
    GenerateExamUseCase,
    CreateExamCommandHandler,
    GenerateQuestionsCommandHandler,
    { provide: EXAM_QUESTION_REPO, useClass: ExamQuestionPrismaRepository },
    AddExamQuestionCommandHandler,
    UpdateExamQuestionCommandHandler,
    ApproveExamCommandHandler,
  ],
})
export class ExamsModule {}
