import { Controller, Post, Body } from '@nestjs/common';
import { GenerateOptionsForQuestionUseCase } from '../../application/usecases/generate-options-for-question.usecase';
import { PublishGeneratedQuestionUseCase, PublishInput } from '../../application/usecases/publish-generated-question.usecase';

@Controller('exams-chat')
export class ExamsChatController {
  constructor(
    private readonly publishUseCase: PublishGeneratedQuestionUseCase,
    private readonly generateOptionsUseCase: GenerateOptionsForQuestionUseCase
  ) {}

  @Post('publish-question')
  async publish(@Body() body: { text: string }) {
    const input: PublishInput = { text: body.text };
    return this.publishUseCase.execute(input);
  }

  @Post('generate-options')
  async generateOptions(@Body() body: { questionId: string }) {
    return this.generateOptionsUseCase.execute({ questionId: body.questionId });
  }
}
