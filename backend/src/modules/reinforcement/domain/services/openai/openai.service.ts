/* eslint-disable prettier/prettier */
import { Inject, Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import type { PromptTemplatePort } from 'src/modules/prompt-template/domain/ports/prompt-template.port';
import { PROMPT_TEMPLATE_PORT } from 'src/modules/prompt-template/tokens';
import { ChatRequest } from 'src/modules/reinforcement/infrastructure/httpchat/dtoC/chat-request';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(
    @Inject(PROMPT_TEMPLATE_PORT)
    private readonly promptTemplatePort: PromptTemplatePort,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
      baseURL: 'https://api.deepseek.com/v1'
    });
  }

  async generateResponse(req: ChatRequest): Promise<string> {
    try {
        const vars: Record<string, string> = {
            user_question: req.question,
        }
        const prompt = await this.promptTemplatePort.render('singleQuestion.v1', vars)
        console.log(prompt)
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente académico que siempre responde en formato JSON estricto según las instrucciones proporcionadas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 1.3,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new Error('Error generating AI response');
    }
  }
}
