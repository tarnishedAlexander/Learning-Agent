import type { Distribution } from '../entities/distribution.vo';

export class PromptBuilder {
  static build(p: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    distribution?: Distribution;
  }): string {
    const difficultyMap: Record<'fácil' | 'medio' | 'difícil', 'easy' | 'medium' | 'hard'> = {
      'fácil': 'easy',
      'medio': 'medium',
      'difícil': 'hard',
    };
    const difficultyEn = difficultyMap[p.difficulty];

    if (p.distribution) {
      return [
        `Generate EXACTLY ${p.totalQuestions} exam questions about "${p.subject}".`,
        `Difficulty: ${difficultyEn} (original: ${p.difficulty}).`,
        `Reference: ${p.reference ?? 'none'}.`,
        `You MUST RESPECT this exact distribution of question types (absolute counts):`,
        JSON.stringify(p.distribution),
        '',
        `RETURN ONLY VALID JSON (application/json).`,
        `The output must be ONE OBJECT containing 4 ARRAYS, in this EXACT format (no extra text, no markdown, no comments):`,
        `{"multiple_choice":[{"type":"multiple_choice","text":"non-empty string","options":["A","B","C","D"]}, ...],` +
          `"true_false":[{"type":"true_false","text":"non-empty string"}, ...],` +
          `"open_analysis":[{"type":"open_analysis","text":"non-empty string"}, ...],` +
          `"open_exercise":[{"type":"open_exercise","text":"non-empty string"}, ...]}`,
        '',
        `STRICT RULES:`,
        `- Do not include ANYTHING outside the JSON (no headers, notes, or markdown fences).`,
        `- Every "text" must be clear, plain text, no HTML.`,
        `- "multiple_choice": include 3–5 distinct options, do not mark the answer.`,
        `- "true_false": DO NOT include options (only the statement).`,
        `- Use standard double quotes; no trailing commas; no undefined values.`,
        `- The JSON MUST parse successfully with JSON.parse.`,
      ].join('\n');
    }

    return [
      `Generate exactly ${p.totalQuestions} exam questions about "${p.subject}".`,
      `Difficulty: ${difficultyEn} (original: ${p.difficulty}).`,
      `Reference: ${p.reference ?? 'none'}.`,
      '',
      `RETURN ONLY VALID JSON (application/json), no extra text, no comments, no markdown.`,
      `The output must be a JSON ARRAY, not an object, in this EXACT format (no trailing commas):`,
      `[`,
      `  {`,
      `    "type": "open" | "multiple_choice",`,
      `    "text": "non-empty string",`,
      `    "options": ["string","string","string","string"] (only if "type" = "multiple_choice", 3–5 options)`,
      `  }`,
      `]`,
      '',
      `STRICT RULES:`,
      `- Do not include anything outside the JSON (no headers, no notes).`,
      `- "text" must be readable, plain text, no HTML, no excessive line breaks.`,
      `- If "type" = "open": DO NOT include "options".`,
      `- If "type" = "multiple_choice": include 3–5 distinct options, without marking the answer.`,
      `- Use standard double quotes, no trailing commas, no undefined values.`,
      `- The JSON MUST parse correctly with JSON.parse.`,
    ].join('\n');
  }
}
