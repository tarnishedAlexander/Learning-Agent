import type { Distribution } from '../entities/distribution.vo';

export class PromptBuilder {
  static build(p: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
    distribution?: Distribution; 
  }): string {
    if (p.distribution) {
      return [
        `Genera EXACTAMENTE ${p.totalQuestions} preguntas de examen sobre "${p.subject}".`,
        `Dificultad: ${p.difficulty}.`,
        `Referencia: ${p.reference ?? 'ninguna'}.`,
        `Debes RESPETAR esta distribución por tipo (cantidades exactas):`,
        JSON.stringify(p.distribution),
        ``,
        `DEVUELVE ÚNICAMENTE JSON VÁLIDO (application/json).`,
        `El resultado debe ser un OBJETO con 4 ARRAYS, con este formato EXACTO (sin texto adicional, sin markdown, sin comentarios):`,
        `{"multiple_choice":[{"type":"multiple_choice","text":"string no vacía","options":["A","B","C","D"]}, ...],`,
        `"true_false":[{"type":"true_false","text":"string no vacía"} , ...],`,
        `"open_analysis":[{"type":"open_analysis","text":"string no vacía"} , ...],`,
        `"open_exercise":[{"type":"open_exercise","text":"string no vacía"} , ...]}`,
        ``,
        `REGLAS ESTRICTAS:`,
        `- No incluyas NADA fuera del JSON (ni encabezados, ni notas).`,
        `- Cada "text" debe ser claro y sin HTML.`,
        `- "multiple_choice": incluye entre 3 y 5 opciones, distintas, sin marcar la respuesta.`,
        `- "true_false": NO incluyas opciones (solo la afirmación).`,
        `- Usa comillas dobles estándar; sin comas colgantes; sin valores undefined.`,
        `- El JSON DEBE parsear con JSON.parse sin errores.`,
      ].join('\n');
    }

    return [
      `Genera exactamente ${p.totalQuestions} preguntas de examen sobre "${p.subject}".`,
      `Dificultad: ${p.difficulty}.`,
      `Referencia: ${p.reference ?? 'ninguna'}.`,
      `Tipo preferido: ${p.preferredType ?? 'mixed'}.`,
      ``,
      `DEVUELVE ÚNICAMENTE JSON VÁLIDO (application/json), sin texto adicional, sin comentarios, sin markdown.`,
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