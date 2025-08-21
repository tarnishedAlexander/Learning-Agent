import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { AskDto } from './dto/ask.dto';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  async ask(@Body() dto: AskDto, @Req() req: Request) {
    const key = req.ip ?? 'anon';
    const result = await this.chatService.ask(dto, key);
    return result;
  }
}
