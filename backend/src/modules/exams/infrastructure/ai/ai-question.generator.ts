// src/modules/exams/infrastructure/ai/ai-question.generator.ts
import { Injectable } from '@nestjs/common';
import type { AIQuestionGeneratorPort } from '../../domain/ports/ai-question-generator.port';
import { Question } from '../../domain/entities/question.entity';
import { PromptBuilder } from '../../domain/services/prompt-builder.service';
import { AiConfigService } from '../../../../core/ai/ai.config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AIQuestionGenerator implements AIQuestionGeneratorPort {
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private readonly cfg: AiConfigService) {
    this.cfg.ensure();
    const genAI = new GoogleGenerativeAI(this.cfg.apiKey);
    this.model = genAI.getGenerativeModel({ model: this.cfg.model });
  }

  async generate(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
  }): Promise<Question[]> {
    const prompt = PromptBuilder.build(params);

    // ✅ Llamada a Gemini con configuración de generación
    const resp = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: this.cfg.maxOutputTokens ?? 512,
        temperature: this.cfg.temperature ?? 0.2,
      },
    });

    const contentText = resp?.response?.text?.() ?? '';
    if (!contentText) {
      throw new Error('AI response vacío.');
    }

    let rawList: any[];
    try {
      rawList = JSON.parse(contentText);
    } catch {
      throw new Error('AI response no es JSON válido.');
    }

    return rawList.map((q) => {
      const type = q?.type === 'multiple_choice' ? 'multiple_choice' : 'open';
      const text = String(q?.text ?? '').trim();
      const options = type === 'multiple_choice' ? q?.options ?? [] : null;
      return new Question(type, text, options);
    });
  }
}
