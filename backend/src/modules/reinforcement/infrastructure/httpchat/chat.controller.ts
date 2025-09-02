import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import type { ChatResponse } from './dtoC/chat-response';
import { DeepSeekService } from '../../domain/services/deepseek/deepseek.service';
import { ChatRequest } from './dtoC/chat-request';

@Controller('chat')
export class ChatController {
  constructor(private deepseekService: DeepSeekService) {}

  @Post()
  @HttpCode(200)
  async chatWithIA(@Body() dto: ChatRequest): Promise<ChatResponse> {
    console.log('pregunta recibida', dto);
    const response = await this.deepseekService.generateResponse(dto);
    return JSON.parse(response) as ChatResponse;
  }
}
