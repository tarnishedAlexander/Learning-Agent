export class PromptBuilder {
  static build(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
  }) {
    const { subject, difficulty, totalQuestions, reference, preferredType } = params;

    const base = [
      `Genera ${totalQuestions} preguntas para un examen.`,
      `Materia: ${subject}`,
      `Dificultad: ${difficulty}`,
      reference ? `Material de referencia: ${reference}` : null,
      preferredType ? `Formato preferido: ${preferredType}` : `Formato: mixed`,
      `Responde estrictamente en JSON con este esquema:`,
      `[{ "type": "open" | "multiple_choice", "text": "string", "options": ["A", "B", "C", "D"]? }]`,
      `Si "type" es "open", omite "options".`,
      `Si "type" es "multiple_choice", incluye 3-5 opciones.`,
      `No incluyas comentarios ni texto fuera del JSON.`,
    ].filter(Boolean).join('\n');

    return base;
  }
}
