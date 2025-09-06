import { Inject, Injectable } from '@nestjs/common';
import { Question } from '../../domain/entities/question.entity';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import { EXAM_QUESTION_REPO } from '../../tokens';

export type PublishInput = {
  text: string;
  type?: 'multiple_choice' | 'true_false';
  options?: unknown;
  source?: string;
  confidence?: number;
  rawMetadata?: Record<string, any>;
};

export type PublishResult =
  | { result: 'created'; questionId: string }
  | { result: 'duplicate' }
  | { result: 'invalid'; questionId: string };

const MAX_CONTENT_LENGTH = 1500;
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE ?? 0.6);

function normalizeText(input: string): string {
  if (!input) return '';
  let t = input.replace(/<[^>]*>/g, ' ');
  t = t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

@Injectable()
export class PublishGeneratedQuestionUseCase {
  constructor(
    @Inject(EXAM_QUESTION_REPO)
    private readonly questionRepo: QuestionRepositoryPort,
  ) {}

  async execute(input: PublishInput): Promise<PublishResult> {
    if (!input || typeof input.text !== 'string') {
      throw new Error('Invalid input: text is required');
    }

    let normalized = normalizeText(input.text);
    if (!normalized) {
      throw new Error('Question empty after normalization');
    }

    if (normalized.length > MAX_CONTENT_LENGTH) {
      normalized = normalized.substring(0, MAX_CONTENT_LENGTH);
    }

    const existing = await this.questionRepo.findAll();
    const normalizedSet = new Set(existing.map((q) => normalizeText(q.text)));
    if (normalizedSet.has(normalized)) {
      return { result: 'duplicate' };
    }

    const question = Question.create(normalized, input.type ?? 'multiple_choice');
    const saved = await this.questionRepo.save(question);

    const confidence = typeof input.confidence === 'number' ? input.confidence : 1;
    if (confidence < MIN_CONFIDENCE) {
      return { result: 'invalid', questionId: saved.id };
    }

    return { result: 'created', questionId: saved.id };
  }
}
