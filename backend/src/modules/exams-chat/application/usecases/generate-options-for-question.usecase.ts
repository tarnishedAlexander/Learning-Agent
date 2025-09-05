import { Inject, Injectable } from '@nestjs/common';
import { EXAM_QUESTION_REPO, EXAM_AI_GENERATOR } from '../../tokens';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import type { OptionGeneratorPort } from '../../domain/ports/option-generator.port';
import { Question, QuestionStatus } from '../../domain/entities/question.entity';

export type GenerateOptionsInput = { questionId: string };

export type GenerateOptionsResult =
  | { result: 'options_generated'; questionId: string; options: string[] }
  | { result: 'invalid'; reason: 'wrong_status' | 'option_generation_failed' };

const MAX_OPTION_LENGTH = 500;
const REQUIRED_OPTIONS_COUNT = 4;

@Injectable()
export class GenerateOptionsForQuestionUseCase {
  constructor(
    @Inject(EXAM_QUESTION_REPO)
    private readonly questionRepo: QuestionRepositoryPort,
    @Inject(EXAM_AI_GENERATOR)
    private readonly generator: OptionGeneratorPort,
  ) {}

  async execute(input: GenerateOptionsInput): Promise<GenerateOptionsResult> {
    if (!input || typeof input.questionId !== 'string') {
      throw new Error('Invalid input: questionId is required');
    }

    const question = await this.questionRepo.findById(input.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.status !== 'generated') {
      return { result: 'invalid', reason: 'wrong_status' };
    }

    let options: string[] | null = null;
    try {
      options = await this.generator.generateOptions(question.text);
    } catch (err) {
      const invalidQ = new Question(
        question.text,
        question.type,
        question.options ?? undefined,
        question.source,
        question.confidence,
        'invalid',
        question.id,
        question.createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    if (!Array.isArray(options) || options.length !== REQUIRED_OPTIONS_COUNT) {
      const invalidQ = new Question(
        question.text,
        question.type,
        question.options ?? undefined,
        question.source,
        question.confidence,
        'invalid',
        question.id,
        question.createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    const cleaned = options.map((o) => (typeof o === 'string' ? o.trim() : ''));

    if (cleaned.some((o) => !o)) {
      const invalidQ = new Question(
        question.text,
        question.type,
        question.options ?? undefined,
        question.source,
        question.confidence,
        'invalid',
        question.id,
        question.createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    if (cleaned.some((o) => o.length > MAX_OPTION_LENGTH)) {
      const invalidQ = new Question(
        question.text,
        question.type,
        question.options ?? undefined,
        question.source,
        question.confidence,
        'invalid',
        question.id,
        question.createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    const updated = new Question(
      question.text,
      question.type,
      cleaned,
      question.source,
      question.confidence,
      'published',
      question.id,
      question.createdAt,
    );

    await this.questionRepo.save(updated);

    return { result: 'options_generated', questionId: question.id, options: cleaned };
  }
}
