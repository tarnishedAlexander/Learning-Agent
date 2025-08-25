import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfigService {

  readonly provider = (process.env.AI_PROVIDER ?? '').toLowerCase();
  readonly apiKey = process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY ?? '';
  readonly model = process.env.AI_MODEL ?? 'gemini-2.0-flash-exp';
  readonly maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 512);
  readonly temperature = Number(process.env.AI_TEMPERATURE ?? 0.2);
  readonly apiUrl = process.env.AI_API_URL ?? process.env.OLLAMA_URL ?? '';
  readonly openaiApiKey = process.env.OPENAI_API_KEY ?? '';
  readonly openaiEmbeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
  readonly openaiEmbeddingDimensions = Number(
    process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536,
  );
  readonly openaiMaxRetries = Number(process.env.OPENAI_MAX_RETRIES ?? 3);
  readonly openaiTimeout = Number(process.env.OPENAI_TIMEOUT ?? 60000);

  ensure() {
    if (this.provider === 'ollama' || this.apiUrl) {
      if (!this.apiUrl) {
        throw new Error('Falta la URL del proveedor Ollama. Define AI_API_URL o OLLAMA_URL en .env');
      }
      return;
    }
    if (!this.apiKey) {
      throw new Error(
        'Falta la API key de IA. Define GEMINI_API_KEY o AI_API_KEY en .env',
      );
    }
  }

  ensureOpenAI() {
    if (!this.openaiApiKey) {
      throw new Error(
        'Falta la API key de OpenAI. Define OPENAI_API_KEY en .env',
      );
    }
  }

  getOpenAIConfig() {
    this.ensureOpenAI();
    return {
      apiKey: this.openaiApiKey,
      timeout: this.openaiTimeout,
      maxRetries: this.openaiMaxRetries,
    };
  }

  getEmbeddingConfig() {
    return {
      model: this.openaiEmbeddingModel,
      dimensions: this.openaiEmbeddingDimensions,
    };
  }
}
