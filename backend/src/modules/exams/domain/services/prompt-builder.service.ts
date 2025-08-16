// src/modules/exams/domain/services/prompt-builder.service.ts
export class PromptBuilder {
  static build(p: {
    subject: string;
    difficulty: 'fácil'|'medio'|'difícil';
    totalQuestions: number;
    reference?: string|null;
    preferredType?: 'open'|'multiple_choice'|'mixed';
  }) {
    // Menos palabras = menos tokens
    return [
      `Genera ${p.totalQuestions} preguntas JSON puro (sin texto extra).`,
      `Materia: ${p.subject}. Dificultad: ${p.difficulty}.`,
      p.reference ? `Referencia: ${p.reference}.` : null,
      `Formato: ${p.preferredType ?? 'mixed'}. Esquema:`,
      `[{"type":"open"|"multiple_choice","text":"string","options":["A","B","C","D"]?}]`,
      `Si "open": sin "options". Si "multiple_choice": 3-5 opciones.`,
    ].filter(Boolean).join(' ');
  }
}
