import { api } from './api/instance';

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
