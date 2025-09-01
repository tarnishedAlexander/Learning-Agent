import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import type { ChatResponse } from './dtoC/chat-response';
import { OpenAIService } from '../../domain/services/openai/openai.service';
import { ChatRequest } from './dtoC/chat-request';

@Controller('chat')
export class ChatController {
  constructor(private openaiService: OpenAIService) {}

  @Post()
  @HttpCode(200)
  async chatWithIA(@Body() dto: ChatRequest): Promise<ChatResponse> {
    console.log('pregunta recibida', dto);
    const response = await this.openaiService.generateResponse(dto);
    return JSON.parse(response) as ChatResponse;
  }
}
