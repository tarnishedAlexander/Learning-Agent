export type QuestionType = 'open' | 'multiple_choice';

export class Question {
  constructor(
    public readonly type: QuestionType,
    public readonly text: string,
    public readonly options?: string[] | null,   
  ) {
    if (!text?.trim()) throw new Error('Question.text es obligatorio');
    if (type === 'multiple_choice' && (!options || options.length < 2)) {
      throw new Error('Multiple choice requiere al menos 2 opciones.');
    }
  }

  toJSON() {
    return {
      type: this.type,
      text: this.text,
      options: this.options ?? null,
    };
  }
}
