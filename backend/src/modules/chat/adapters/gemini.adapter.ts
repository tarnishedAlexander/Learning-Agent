import { Injectable, Logger } from '@nestjs/common';
import { IAIProvider } from '../iai.provider';
import { AiConfigService } from 'src/core/ai/ai.config';

const logger = new Logger('GeminiAdapter');

@Injectable()
export class GeminiAdapter implements IAIProvider {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1';
  constructor(private readonly config: AiConfigService) {}

  async ask(prompt: string, options?: { lang?: string; context?: string }): Promise<string> {
    if (!this.config.apiKey) {
      logger.warn('GEMINI_API_KEY no configurada — usando respuesta mock.');
      return `Respuesta mock para: "${prompt.slice(0, 120)}" (agrega GEMINI_API_KEY para obtener respuesta real).`;
    }

    const model = encodeURIComponent(this.config.model);
    const url = `${this.baseUrl}/models/${model}:generateText`;

    const body: any = {
      prompt: {
        text: prompt,
      },
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        logger.error(`Generative API responded ${res.status}: ${txt}`);
        return `Error al consultar el proveedor de IA (status ${res.status}).`;
      }

      const json = await res.json();

      const candidateText =
        json?.candidates?.[0]?.content ||
        json?.candidates?.[0]?.output ||
        json?.output?.[0]?.content ||
        json?.reply ||
        json?.text ||
        (typeof json === 'string' ? json : null);

      if (candidateText) return String(candidateText);

      return JSON.stringify(json).slice(0, 2000);
    } catch (err) {
      logger.error('Error en GeminiAdapter.ask: ' + (err as Error).message);
      return 'Error interno al comunicarse con la IA.';
    }
  }
}
