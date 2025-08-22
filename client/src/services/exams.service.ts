import { api } from './api/instance';

const USE_MOCK = String(import.meta.env.VITE_API_MOCK || 'false') === 'true';

export async function createExam(payload: any){
  const dto = {
    subject: String(payload.subject || '').trim(),
    difficulty: payload.difficulty as 'fácil' | 'medio' | 'difícil',
    attempts: Number(payload.attempts),
    timeMinutes: Number(payload.timeMinutes),
    reference: payload.reference ? String(payload.reference).slice(0,1000) : undefined,
    totalQuestions: Number(payload.totalQuestions ?? 0),
    distribution: {
      multiple_choice: Number(payload.multipleChoice || 0),
      true_false:     Number(payload.trueFalse || 0),
      open_analysis:  Number(payload.analysis || 0),
      open_exercise:  Number(payload.openEnded || 0),
    }
  };
  return api.post('/exams', dto);
}

export async function generateQuestions(values: any) {
  const payload = {
    subject: String(values.subject || '').trim(),
    difficulty: values.difficulty as 'fácil' | 'medio' | 'difícil',
    totalQuestions: Number(values.totalQuestions || 0),
    reference: values.reference ? String(values.reference).slice(0,1000) : undefined,
    distribution: {
      multiple_choice: Number(values.multipleChoice || 0),
      true_false:      Number(values.trueFalse || 0),
      open_analysis:   Number(values.analysis || 0),
      open_exercise:   Number(values.openEnded || 0),
    },
  };

  // Fallback para demos sin IA real
  if (USE_MOCK) {
    const make = (type: string, n: number) =>
      Array.from({ length: n }).map((_, i) => ({
        type,
        text: `[MOCK] ${payload.subject} · ${i + 1}`,
        ...(type === 'multiple_choice'
          ? { options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'] }
          : {}),
      }));

    return {
      ok: true,
      data: {
        questions: {
          multiple_choice: make('multiple_choice', payload.distribution.multiple_choice),
          true_false: make('true_false', payload.distribution.true_false),
          open_analysis: make('open_analysis', payload.distribution.open_analysis),
          open_exercise: make('open_exercise', payload.distribution.open_exercise),
        },
      },
    };
  }

  return api.post('/exams/questions', payload);
}