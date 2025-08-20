export type QuestionType = 'multiple_choice' | 'true_false' | 'open_analysis' | 'open_exercise';

export class Question {
  constructor(
    public readonly type: QuestionType,
    public readonly text: string,
    public readonly options?: string[] | null,
  ) {
    if (!text?.trim()) throw new Error('Question.text es obligatorio');
    if (type === 'multiple_choice' && (!options || options.length < 2)) {
      throw new Error('multiple_choice requiere al menos 2 opciones.');
    }
  }
  toJSON() { 
    return { 
    type: this.type, 
    text: this.text, 
    options: this.options ?? null }; }
}