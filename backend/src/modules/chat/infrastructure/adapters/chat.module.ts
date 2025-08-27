import { Module } from '@nestjs/common';
import { Chat_PORT } from './tokens';
import { ChatAdapter } from './chat.adapter';

const implProvider = {
  provide: Chat_PORT,
  useClass: (() => {
    //const provider = process.env.LLM_PROVIDER?.toLowerCase();
    // if (provider === 'openai') {
    //   return require('@/modules/llm-openai/infrastructure/openai.adapter')
    //     .OpenAiAdapter;
    // }
    // if (provider === 'gemini') {
    //   return require('@/modules/llm-gemini/infrastructure/gemini.adapter')
    //     .GeminiAdapter;
    // }
    const provider = process.env.Chat_PROVIDER?.toLowerCase();
      if (provider === 'openai') {
        return require('@/modules/chat-openai/infrastructure/openai.adapter')
          .OpenAiAdapter;
      }
  })(),
};

@Module({
  providers: [implProvider],
  exports: [Chat_PORT],
})
export class ChatModule {}
