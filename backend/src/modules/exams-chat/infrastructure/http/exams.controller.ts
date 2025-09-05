import { Controller, Post, Body } from '@nestjs/common';
import { PublishGeneratedQuestionUseCase } from '../../application/usecases/publish-generated-question.usecase';
import { GenerateOptionsForQuestionUseCase } from '../../application/usecases/generate-options-for-question.usecase';

@Controller('exams-chat')
export class ExamsChatController {
  constructor(
    private readonly publishUseCase: PublishGeneratedQuestionUseCase,
    private readonly generateOptionsUseCase: GenerateOptionsForQuestionUseCase,
  ) {}

  @Post('publish')
  async publishQuestion(@Body() body: { text: string; confidence?: number; source?: string }) {
    const { text, confidence, source } = body;
    return this.publishUseCase.execute({ text, confidence, source });
  }

  @Post('generate-options')
  async generateOptions(@Body() body: { questionId: string }) {
    const { questionId } = body;
    return this.generateOptionsUseCase.execute({ questionId });
  }
}
