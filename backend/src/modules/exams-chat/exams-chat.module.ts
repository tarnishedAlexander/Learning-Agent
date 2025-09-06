import { Module } from '@nestjs/common';
import { ExamsChatController } from './infrastructure/http/exams.controller';
import { DeepseekQuestionAdapter } from './infrastructure/persistance/prisma-question-repository.adapter';
import * as AiGenModule from './infrastructure/ai/ai-question.generator';
import { EXAM_QUESTION_REPO, EXAM_AI_GENERATOR } from './tokens';
import { GenerateOptionsForQuestionUseCase } from './application/usecases/generate-options-for-question.usecase';
import { PublishGeneratedQuestionUseCase } from './application/usecases/publish-generated-question.usecase';
import { DeepseekModule } from '../deepseek/deepseek.module';

const AiGeneratorClass =
  (AiGenModule as any).AIQuestionGenerator ??
  (AiGenModule as any).AiQuestionGenerator ??
  (AiGenModule as any).default;

class AiGeneratorFallback {
  async generateOptions(_text: string): Promise<string[]> {
    throw new Error('AI generator not available');
  }
}

const AiProvider =
  typeof AiGeneratorClass === 'function'
    ? { provide: EXAM_AI_GENERATOR, useClass: AiGeneratorClass }
    : { provide: EXAM_AI_GENERATOR, useClass: AiGeneratorFallback };

@Module({
  imports: [DeepseekModule],
  controllers: [ExamsChatController],
  providers: [
    { provide: EXAM_QUESTION_REPO, useClass: DeepseekQuestionAdapter },
    AiProvider,
    GenerateOptionsForQuestionUseCase,
    PublishGeneratedQuestionUseCase,
  ],
  exports: [AiProvider],
})
export class ExamsChatModule {}
