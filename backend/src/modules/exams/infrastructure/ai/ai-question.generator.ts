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

function tryParseObject(text: string): any | null {
  try { return JSON.parse(text); } catch { return null; }
}

function parseJsonObjectLenient(text: string): any {
  // 1) sin fences
  const cleaned = stripFences(text);
  let obj = tryParseObject(cleaned);
  if (obj) return obj;

  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    const cut = cleaned.slice(0, lastBrace + 1);
    obj = tryParseObject(cut);
    if (obj) return obj;
  }

  const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
  obj = tryParseObject(noTrailingCommas);
  if (obj) return obj;

  throw new Error(`AI response no es JSON válido (objeto esperado): ${text}`);
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

  private async genOnce(prompt: string) {
    const resp = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: this.cfg.maxOutputTokens ?? 2048, 
        temperature: this.cfg.temperature ?? 0.2,
        responseMimeType: 'application/json', 
      },
    });
    const text: string = resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('AI response vacío.');
    return text;
  }

  private async parseObjectOrRetry(originalPrompt: string, raw: string) {
    try {
      return parseJsonObjectLenient(raw);
    } catch {
      const fixPrompt = [
        `You returned invalid JSON. Fix it now.`,
        `Return ONLY the corrected JSON object (no markdown, no notes).`,
        `Keep EXACTLY the same structure and counts.`,
        `Here is your previous output:`,
        raw
      ].join('\n');

      const fixText = await this.genOnce(fixPrompt);
      return parseJsonObjectLenient(fixText);
    }
  }

  async generate(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    distribution?: Distribution;
  }): Promise<Question[]> {
    const prompt = PromptBuilder.build({
      subject: params.subject,
      difficulty: params.difficulty,
      totalQuestions: params.totalQuestions,
      reference: params.reference ?? null,
      distribution: params.distribution,
    });

    const contentText = await this.genOnce(prompt);

    if (params.distribution) {
      // esperamos OBJETO con 4 arrays
      const obj = await this.parseObjectOrRetry(prompt, contentText);
      const d = params.distribution;

      const mcq = Array.isArray(obj?.multiple_choice) ? obj.multiple_choice : [];
      const tf  = Array.isArray(obj?.true_false)      ? obj.true_false      : [];
      const oa  = Array.isArray(obj?.open_analysis)   ? obj.open_analysis   : [];
      const oe  = Array.isArray(obj?.open_exercise)   ? obj.open_exercise   : [];

      const ok =
        mcq.length === (d.multiple_choice ?? 0) &&
        tf.length  === (d.true_false ?? 0) &&
        oa.length  === (d.open_analysis ?? 0) &&
        oe.length  === (d.open_exercise ?? 0);

      if (!ok) {
        throw new Error('AI response no respeta la distribución solicitada.');
      }

      const mapped = [
        ...mcq.map((q: any) => new Question('multiple_choice', String(q?.text ?? '').trim(), q?.options ?? [])),
        ...tf.map((q: any)  => new Question('true_false', String(q?.text ?? '').trim())),
        ...oa.map((q: any)  => new Question('open_analysis', String(q?.text ?? '').trim())),
        ...oe.map((q: any)  => new Question('open_exercise', String(q?.text ?? '').trim())),
      ];
      return mapped;
    }

    const cleaned = stripFences(contentText);
    let list: any[];
    try {
      list = JSON.parse(cleaned);
    } catch {
      const last = cleaned.lastIndexOf(']');
      if (last === -1) throw new Error(`AI response no es JSON válido (array esperado): ${contentText}`);
      const cut = cleaned.slice(0, last + 1);
      list = JSON.parse(cut);
    }

    return list.map((q: any) => {
      const type = mapRawTypeToQuestionType(q?.type);
      const text = String(q?.text ?? '').trim();
      const options = type === 'multiple_choice' ? (q?.options ?? []) : null;
      return new Question(type, text, options);
    });
  }
}
