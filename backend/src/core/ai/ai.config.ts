// src/core/ai/ai.config.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfigService {
  // Acepta GEMINI_API_KEY o AI_API_KEY (por si ya tenías AI_API_KEY)
  readonly apiKey = process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY ?? '';
  // Permite override por env; default al modelo pedido
  readonly model  = process.env.AI_MODEL ?? 'gemini-1.5-pro-latest';

  ensure() {
    if (!this.apiKey) {
      throw new Error('Falta la API key de IA. Define GEMINI_API_KEY o AI_API_KEY en .env');
    }
  }
}
