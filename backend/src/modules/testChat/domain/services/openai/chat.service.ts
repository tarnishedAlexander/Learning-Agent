/* eslint-disable prettier/prettier */
import { Inject, Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import type { PromptTemplatePort } from 'src/modules/prompt-template/domain/ports/prompt-template.port';
import { PROMPT_TEMPLATE_PORT } from 'src/modules/prompt-template/tokens';
import { ChatAnswer } from 'src/modules/testChat/infrastructure/httpchat/dtoChat/generate-advice';
import { QuestionResponse } from 'src/modules/testChat/infrastructure/httpchat/dtoChat/question-response';

interface OpenAICoachingResponse {
  generated_question: string;
  user_response: string;
  coaching_advice: string;
}

@Injectable()
export class ChatInterviewService {
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

  async generateQuestion(topico: string): Promise<QuestionResponse> {
    try {
      const vars: Record<string, string> = {
            topico: topico,
        }
      const prompt = await this.promptTemplatePort.render('interview.v1', vars);
      
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que siempre responde en formato JSON estricto.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 150,
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      const response = JSON.parse(responseContent) as QuestionResponse ;
      
      return response;

    } catch (error) {
      console.error('OpenAI Error in generateQuestion:', error);
      throw new Error('Error generating question');
    }
  }

  // UPDATED METHOD: Generate advice based on question and answer
  async generateAdvise(chatAnswer: ChatAnswer): Promise<OpenAICoachingResponse> {
    try {
      const vars: Record<string, string> = {
        user_question: chatAnswer.question,
        user_answer: chatAnswer.answer,
        topic: chatAnswer.topic
      };

      const prompt = await this.promptTemplatePort.render('interview-advice.v1', vars);
      console.log('mensaje', prompt)
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que siempre responde en formato JSON estricto.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No response from AI');
      }

      const coachingResponse: OpenAICoachingResponse = JSON.parse(responseContent) as OpenAICoachingResponse;
      console.log('resp advice',coachingResponse);
      return coachingResponse;

    } catch (error) {
      console.error('OpenAI Error in generateAdvise:', error);
      throw new Error('Error generating AI response');
    }
  }
}