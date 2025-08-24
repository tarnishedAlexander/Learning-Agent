import { Injectable, Logger } from '@nestjs/common';
import { IAIProvider } from '../iai.provider';
import { AiConfigService } from 'src/core/ai/ai.config';

const logger = new Logger('OllamaAdapter');

@Injectable()
export class OllamaAdapter implements IAIProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: AiConfigService) {
    this.baseUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  }

  async ask(prompt: string, options?: { lang?: string; context?: string }): Promise<string> {
    const model = (this.config?.model ?? process.env.AI_MODEL ?? 'gemma3:1b') as string;
    const url = `${this.baseUrl}/api/generate`;
    const body: any = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: this.config?.temperature ?? Number(process.env.AI_TEMPERATURE ?? 0.7),
        num_predict: Number(this.config?.maxOutputTokens ?? process.env.AI_MAX_OUTPUT_TOKENS ?? 512),
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        logger.error(`Ollama responded ${res.status}: ${txt}`);
        return `Error al consultar Ollama (status ${res.status}).`;
      }

      const json = await res.json();

      const candidateText =
        json?.response ??
        (Array.isArray(json?.response) ? json.response.join('\n') : undefined) ??
        (typeof json === 'string' ? json : undefined);

      if (candidateText) return String(candidateText);

      return JSON.stringify(json).slice(0, 2000);
    } catch (err) {
      logger.error('Error en OllamaAdapter.ask: ' + (err as Error).message);
      return 'Error interno al comunicarse con Ollama.';
    }
  }
}
