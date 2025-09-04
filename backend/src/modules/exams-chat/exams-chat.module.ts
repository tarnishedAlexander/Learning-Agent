import { Module } from '@nestjs/common';
import { ExamsChatController } from './infrastructure/http/exams.controller';
import { DeepseekQuestionAdapter } from './infrastructure/persistance/prisma-question-repository.adapter';
import { EXAM_QUESTION_REPO } from './tokens';
import { GenerateOptionsForQuestionUseCase } from './application/usecases/generate-options-for-question.usecase';
import { PublishGeneratedQuestionUseCase } from './application/usecases/publish-generated-question.usecase';

@Module({
  imports: [],
  controllers: [ExamsChatController],
  providers: [
    { provide: EXAM_QUESTION_REPO, useClass: DeepseekQuestionAdapter },
    GenerateOptionsForQuestionUseCase,
    PublishGeneratedQuestionUseCase,
  ],
})
export class ExamsChatModule {}
