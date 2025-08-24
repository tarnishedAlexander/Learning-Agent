import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { AiConfigService } from 'src/core/ai/ai.config';
import { CacheModule } from 'src/core/cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [ChatController],
  providers: [ChatService, OllamaAdapter, AiConfigService],
  exports: [ChatService],
})
export class ChatModule {}
