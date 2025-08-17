import { Injectable } from '@nestjs/common';
import type { AIQuestionGeneratorPort } from '../../domain/ports/ai-question-generator.port';
import { Question } from '../../domain/entities/question.entity';
import { PromptBuilder } from '../../domain/services/prompt-builder.service';
import { AiConfigService } from '../../../../core/ai/ai.config';
import { GoogleGenerativeAI } from '@google/generative-ai';

function parseJsonArrayStrictOrCut(text: string): any[] {
  try { return JSON.parse(text); } catch {}
  const cleaned = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const end = cleaned.lastIndexOf(']');
  if (end !== -1) {
    const cut = cleaned.slice(0, end + 1);
    try { return JSON.parse(cut); } catch {}
  }
  throw new Error(`AI response no es JSON válido: ${text}`);
}

@Injectable()
export class AIQuestionGenerator implements AIQuestionGeneratorPort {
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private readonly cfg: AiConfigService) {
    this.cfg.ensure();
    const genAI = new GoogleGenerativeAI(this.cfg.apiKey);
    this.model = genAI.getGenerativeModel({
      model: this.cfg.model || 'gemini-1.5-pro-latest',
    });
  }

  async generate(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
  }): Promise<Question[]> {
    const prompt = PromptBuilder.build(params);

    const resp = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: this.cfg.maxOutputTokens ?? 1024, 
        temperature: this.cfg.temperature ?? 0.2,
        responseMimeType: 'application/json',
      },
    });

    let contentText: string =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!contentText) throw new Error('AI response vacío.');

    contentText = contentText.replace(/```json|```/g, '').trim();

    const rawList = parseJsonArrayStrictOrCut(contentText);

    return rawList.map((q: any) => {
      const type = q?.type === 'multiple_choice' ? 'multiple_choice' : 'open';
      const text = String(q?.text ?? '').trim();
      const options = type === 'multiple_choice' ? (q?.options ?? []) : null;
      return new Question(type, text, options);
    });
  }
}
