export class PromptBuilder {
  static build(p: {
    subject: string;
    difficulty: 'fácil'|'medio'|'difícil';
    totalQuestions: number;
    reference?: string|null;
    preferredType?: 'open'|'multiple_choice'|'mixed';
  }): string {
    return [
      `Genera exactamente ${p.totalQuestions} preguntas de examen sobre "${p.subject}".`,
      `Dificultad: ${p.difficulty}.`,
      `Referencia: ${p.reference ?? 'ninguna'}.`,
      `Tipo preferido: ${p.preferredType ?? 'mixed'}.`,
      ``,
      `DEVUELVE ÚNICAMENTE JSON VÁLIDO (application/json), sin texto adicional, sin comentarios, sin explicaciones, sin markdown.`,
      `El resultado debe ser un ARRAY JSON, no un objeto, con esta forma EXACTA (sin comas finales):`,
      `[`,
      `  {`,
      `    "type": "open" | "multiple_choice",`,
      `    "text": "string no vacía",`,
      `    "options": ["string","string","string","string"] (solo si "type" = "multiple_choice", 3 a 5 opciones)`,
      `  }`,
      `]`,
      ``,
      `REGLAS ESTRICTAS:`,
      `- No incluyas nada fuera del JSON (ni encabezados, ni notas).`,
      `- "text" debe ser legible, sin HTML, sin saltos de línea excesivos.`,
      `- Si "type" = "open": NO incluyas "options".`,
      `- Si "type" = "multiple_choice": incluye entre 3 y 5 opciones, todas distintas, sin la respuesta marcada.`,
      `- Usa comillas dobles estándar, sin comas colgantes, sin valores undefined.`,
      `- El JSON DEBE parsear correctamente con JSON.parse.`,
    ].join('\n');
  }
}
