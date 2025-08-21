import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { AiConfigService } from 'src/core/ai/ai.config';

@Module({
  controllers: [ChatController],
  providers: [ChatService, GeminiAdapter, AiConfigService],
  exports: [ChatService],
})
export class ChatModule {}
