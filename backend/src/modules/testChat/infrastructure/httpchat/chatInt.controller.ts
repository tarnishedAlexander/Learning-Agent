import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { QuestionResponse } from './dtoChat/question-response';
import { ChatInterviewService } from '../../domain/services/deepseek/chat.service';
import { ChatAnswer } from './dtoChat/generate-advice';

interface CoachingResponse {
  generated_question: string;
  user_response: string;
  coaching_advice: string;
}

@Controller('chatint')
export class ChatIntController {
  constructor(private readonly chatInterviewService: ChatInterviewService) {}

  // Get a new question
  @Get('question')
  async generateQuestion(
    @Query('topico') topico: string,
  ): Promise<QuestionResponse> {
    return this.chatInterviewService.generateQuestion(topico);
  }

  // Get advice for an answer
  @Post('advice')
  async generateAdvice(
    @Body() chatAnswer: ChatAnswer,
  ): Promise<CoachingResponse> {
    console.log('answer:', chatAnswer);
    return this.chatInterviewService.generateAdvise(chatAnswer);
  }
}
