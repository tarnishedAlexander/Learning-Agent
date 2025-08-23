import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { AskDto } from './dto/ask.dto';
import { IAIProvider } from './iai.provider';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { AiConfigService } from 'src/core/ai/ai.config';

const WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 10);

@Injectable()
export class ChatService {
  private readonly requests = new Map<string, number[]>();
  private readonly provider: IAIProvider;

  constructor(private readonly config: AiConfigService, geminiAdapter: GeminiAdapter) {
    this.provider = geminiAdapter as IAIProvider;
  }

  async ask(dto: AskDto, key = 'anon'): Promise<{ answer: string }> {
    this.enforceRateLimit(key);
    const prompt = this.buildPrompt(dto);
    try {
      const answer = await this.provider.ask(prompt, { lang: dto.lang, context: dto.context });
      return { answer };
    } catch {
      throw new InternalServerErrorException('Error al obtener respuesta de la IA.');
    }
  }

  private buildPrompt(dto: AskDto) {
    const header = `Eres un asistente académico. Responde de forma clara y concisa en ${dto.lang === 'es' ? 'español' : 'inglés'}. Contexto: ${dto.context}.`;
    return `${header}\n\nPregunta: ${dto.question}`;
  }

  private enforceRateLimit(key: string) {
    const now = Date.now();
    const arr = (this.requests.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
    if (arr.length >= DEFAULT_RATE_LIMIT) {
      throw new HttpException('Demasiadas solicitudes — intenta de nuevo más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    arr.push(now);
    this.requests.set(key, arr);
  }

}
