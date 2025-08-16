// src/modules/exams/exams.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { EXAM_REPO, EXAM_AI_GENERATOR } from './tokens';
import { ExamPrismaRepository } from './infrastructure/persistence/exam.prisma.repository';
import { ExamsController } from './infrastructure/http/exams.controller';
import { CreateExamCommandHandler } from './application/commands/create-exam.command';
import { GenerateQuestionsCommandHandler } from './application/commands/generate-questions.command';
import { AIQuestionGenerator } from './infrastructure/ai/ai-question.generator';
import { AiConfigService } from '../../core/ai/ai.config';

@Module({
  imports: [PrismaModule],
  controllers: [ExamsController],
  providers: [
    // Persistencia
    { provide: EXAM_REPO, useClass: ExamPrismaRepository },

    // IA (adapter)
    { provide: EXAM_AI_GENERATOR, useClass: AIQuestionGenerator },
    AiConfigService,

    // Application
    CreateExamCommandHandler,
    GenerateQuestionsCommandHandler,
  ],
})
export class ExamsModule {}
