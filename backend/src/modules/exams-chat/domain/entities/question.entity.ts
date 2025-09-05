import { v4 as uuidv4 } from 'uuid';

export type QuestionStatus = 'generated' | 'invalid' | 'published';

export type QuestionType = 'multiple_choice' | 'true_false' | 'open_analysis' | 'open_exercise';

export class Question {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly status: QuestionStatus;
  public readonly confidence: number;

  constructor(
    public readonly text: string,
    public readonly type: QuestionType = 'open_analysis',
    public readonly options?: string[] | null,
    public readonly source?: string,
    confidence?: number,
    status?: QuestionStatus,
    id?: string,
    createdAt?: Date,
  ) {
    this.id = id ?? uuidv4();
    this.createdAt = createdAt ?? new Date();
    this.status = status ?? 'generated';
    this.confidence = confidence ?? 1;

    if (!text?.trim()) throw new Error('Question.text es obligatorio');
    if (text.length > 2000) throw new Error('Question.text excede el máximo de 2000 caracteres');
    if (type === 'multiple_choice' && (!options || options.length < 2)) {
      throw new Error('multiple_choice requiere al menos 2 opciones.');
    }
  }

  static create(
    text: string,
    type: QuestionType = 'open_analysis',
    options?: string[] | null,
    source?: string,
    confidence?: number,
    status?: QuestionStatus,
  ) {
    return new Question(text, type, options, source, confidence, status);
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      type: this.type,
      options: this.options ?? null,
      source: this.source,
      confidence: this.confidence,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
    };
  }
}