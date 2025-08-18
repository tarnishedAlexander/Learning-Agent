import { Injectable } from '@nestjs/common';
import type { AIQuestionGeneratorPort } from '../../domain/ports/ai-question-generator.port';
import { Question, type QuestionType } from '../../domain/entities/question.entity';
import { PromptBuilder } from '../../domain/services/prompt-builder.service';
import { AiConfigService } from '../../../../core/ai/ai.config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Distribution } from '../../domain/entities/distribution.vo';

function stripFences(text: string): string {
  return text.replace(/```json|```/g, '').trim();
}

function parseJsonArrayStrictOrCut(text: string): any[] {
  try { return JSON.parse(text); } catch {}
  const cleaned = stripFences(text);
  try { return JSON.parse(cleaned); } catch {}
  const end = cleaned.lastIndexOf(']');
  if (end !== -1) {
    const cut = cleaned.slice(0, end + 1);
    try { return JSON.parse(cut); } catch {}
  }
  throw new Error(`AI response no es JSON válido (array esperado): ${text}`);
}

function parseJsonObjectStrict(text: string): any {
  const cleaned = stripFences(text);
  try { return JSON.parse(cleaned); } catch {}
  throw new Error(`AI response no es JSON válido (objeto esperado): ${text}`);
}

function mapRawTypeToQuestionType(raw: unknown): QuestionType {
  const t = String(raw ?? '').trim();
  switch (t) {
    case 'multiple_choice': return 'multiple_choice';
    case 'true_false':      return 'true_false';
    case 'open_analysis':   return 'open_analysis';
    case 'open_exercise':   return 'open_exercise';
    case 'open':            return 'open_analysis'; 
    default:                return 'open_analysis';
  }
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
    distribution?: Distribution; 
  }): Promise<Question[]> {
    const prompt = PromptBuilder.build({
      subject: params.subject,
      difficulty: params.difficulty,
      totalQuestions: params.totalQuestions,
      reference: params.reference ?? null,
      preferredType: params.preferredType ?? 'mixed',
      distribution: params.distribution,
    });

    const resp = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: this.cfg.maxOutputTokens ?? 1024,
        temperature: this.cfg.temperature ?? 0.2,
        responseMimeType: 'application/json',
      },
    });

    let contentText: string = resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!contentText) throw new Error('AI response vacío.');

    if (params.distribution) {
      const obj = parseJsonObjectStrict(contentText);
      const d = params.distribution;

      const mcq = Array.isArray(obj?.multiple_choice) ? obj.multiple_choice : null;
      const tf  = Array.isArray(obj?.true_false)      ? obj.true_false      : null;
      const oa  = Array.isArray(obj?.open_analysis)   ? obj.open_analysis   : null;
      const oe  = Array.isArray(obj?.open_exercise)   ? obj.open_exercise   : null;

      const ok =
        mcq !== null && mcq.length === d.multiple_choice &&
        tf  !== null && tf.length  === d.true_false &&
        oa  !== null && oa.length  === d.open_analysis &&
        oe  !== null && oe.length  === d.open_exercise;

      if (!ok) throw new Error('AI response no respeta la distribución solicitada.');

      const mapped = [
        ...mcq!.map((q: any) => new Question('multiple_choice', String(q?.text ?? '').trim(), q?.options ?? [])),
        ...tf!.map((q: any)  => new Question('true_false', String(q?.text ?? '').trim())),
        ...oa!.map((q: any)  => new Question('open_analysis', String(q?.text ?? '').trim())),
        ...oe!.map((q: any)  => new Question('open_exercise', String(q?.text ?? '').trim())),
      ];
      return mapped;
    }

    const rawList = parseJsonArrayStrictOrCut(contentText);
    return rawList.map((q: any) => {
      const type = mapRawTypeToQuestionType(q?.type);
      const text = String(q?.text ?? '').trim();
      const options = type === 'multiple_choice' ? (q?.options ?? []) : null;
      return new Question(type, text, options);
    });
  }
}