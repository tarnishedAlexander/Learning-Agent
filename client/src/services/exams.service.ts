import { api } from './api/instance';

export async function createExam(payload: any){
  const dto = {
    subject: String(payload.subject || '').trim(),
    difficulty: payload.difficulty as 'fácil' | 'medio' | 'difícil',
    attempts: Number(payload.attempts),
    totalQuestions: Number(payload.totalQuestions),
    timeMinutes: Number(payload.timeMinutes),
    reference: payload.reference ? String(payload.reference).slice(0,1000) : undefined
  };
  return api.post('/exams', dto);
}
