import { Injectable, Inject } from '@nestjs/common';
import type { DeepseekPort } from 'src/modules/deepseek/domain/ports/deepseek.port';
import { DEEPSEEK_PORT } from 'src/modules/deepseek/tokens';

export type GeneratedOptions = {
  options: string[];
  correctIndex: number | null;
  confidence: number | null;
};

export type GeneratedQuestion = {
  text: string;
};

@Injectable()
export class AIQuestionGenerator {
  constructor(@Inject(DEEPSEEK_PORT) private readonly deepseek?: DeepseekPort) {}

  private normalizeLine(l: string) {
    return l.replace(/^[\d\)\.\-\s]+/, '').trim();
  }

  async generateQuestion(): Promise<GeneratedQuestion> {
    if (!this.deepseek) return { text: 'Genera una pregunta sobre algoritmos de programación, de opción múltiple' };
    const resp = await this.deepseek.generateQuestion('Genera una pregunta sobre algoritmos de programación, de opción múltiple');
    const text = resp?.question ?? 'Pregunta sobre algoritmos de programación, de opción múltiple';
    return { text };
  }

  async generateTrueFalseQuestion(): Promise<GeneratedQuestion> {
    if (!this.deepseek) return { text: 'El algoritmo de Quicksort siempre es estable. (Verdadero o Falso)' };
    const resp = await this.deepseek.generateQuestion('Genera una pregunta de verdadero o falso sobre algoritmos de programación');
    const text = resp?.question ?? 'Pregunta de verdadero o falso sobre algoritmos de programación';
    return { text };
  }

  async generateOptions(questionText: string): Promise<GeneratedOptions> {
    if (!questionText?.trim()) throw new Error('Text required');

    const fallback: GeneratedOptions = {
      options: [
        `${questionText} — opción A`,
        `${questionText} — opción B`,
        `${questionText} — opción C`,
        `${questionText} — opción D`,
      ],
      correctIndex: null,
      confidence: null,
    };

    if (!this.deepseek) return fallback;

    try {
      const resp = await this.deepseek.generateResponse(
        `Genera 4 opciones relacionadas y distintas para esta pregunta: "${questionText}"`
      );
      const candidate = (resp?.answer ?? resp?.explanatio ?? '').toString().trim();
      if (!candidate) return fallback;

      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return { options: parsed.slice(0, 4).map(String), correctIndex: null, confidence: null };
        }
        if (parsed && Array.isArray((parsed as any).options)) {
          const opts = (parsed as any).options.slice(0, 4).map(String);
          return { options: opts, correctIndex: null, confidence: null };
        }
      } catch (_) {}

      const lines = candidate
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(this.normalizeLine);

      if (lines.length >= 4) return { options: lines.slice(0, 4), correctIndex: null, confidence: null };

      const pieces = candidate.split(/;|\/|\||\t/).map(p => p.trim()).filter(Boolean);
      if (pieces.length >= 4) return { options: pieces.slice(0, 4), correctIndex: null, confidence: null };

      return fallback;
    } catch (err) {
      return fallback;
    }
  }
}