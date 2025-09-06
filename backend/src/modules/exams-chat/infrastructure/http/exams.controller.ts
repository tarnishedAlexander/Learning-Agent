import { Controller, Get, Post, Body } from '@nestjs/common';
import { GenerateOptionsForQuestionUseCase } from '../../application/usecases/generate-options-for-question.usecase';
import { PublishGeneratedQuestionUseCase } from '../../application/usecases/publish-generated-question.usecase';

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

  @Get('generate-options')
  async generateOptionsGet() {
    return this.generateOptionsUseCase.execute();
  }

  @Post('generate-options')
  async generateOptionsPost() {
    return this.generateOptionsUseCase.execute();
  }
}