import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfigService {
  readonly apiKey = process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY ?? '';
  readonly model  = process.env.AI_MODEL ?? 'gemini-2.0-flash-exp';
  readonly maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 512);
  readonly temperature = Number(process.env.AI_TEMPERATURE ?? 0.2);

  ensure() {
    if (!this.apiKey) {
      throw new Error('Falta la API key de IA. Define GEMINI_API_KEY o AI_API_KEY en .env');
    }
  }
}
