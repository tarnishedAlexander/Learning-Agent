import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { AskDto } from './dto/ask.dto';
import { IAIProvider } from './iai.provider';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { AiConfigService } from 'src/core/ai/ai.config';
import { CacheService } from 'src/core/cache/cache.service';
import { ChatSessionRepository } from './chat-session.repository';

const WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 10);

@Injectable()
export class ChatService {
  private readonly requests = new Map<string, number[]>();
  private readonly provider: IAIProvider;

  constructor(
    private readonly config: AiConfigService,
    private readonly ollamaAdapter: OllamaAdapter,
    private readonly cacheService: CacheService,
    private readonly chatSessionRepository: ChatSessionRepository
  ) {
    this.provider = ollamaAdapter as IAIProvider;
  }

  async ask(dto: AskDto, key = 'anon'): Promise<{ answer: string }> {
    this.enforceRateLimit(key);
    const prompt = this.buildPrompt(dto);

    const cached = await this.cacheService.get(prompt);
    if (cached) return { answer: cached };

    try {
      const answer = await this.provider.ask(prompt, { lang: dto.lang, context: dto.context });

      await this.cacheService.set(prompt, answer);

      const sessionKey = `${key}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await this.chatSessionRepository.create(sessionKey, prompt, answer, expiresAt);

      return { answer };
    } catch {
      throw new InternalServerErrorException('Error al obtener respuesta de la IA.');
    }
  }

  private buildPrompt(dto: AskDto) {
    const header = `Eres un asistente académico. Responde de forma clara y concisa en ${
      dto.lang === 'es' ? 'español' : 'inglés'
    }. Contexto: ${dto.context}.`;
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
