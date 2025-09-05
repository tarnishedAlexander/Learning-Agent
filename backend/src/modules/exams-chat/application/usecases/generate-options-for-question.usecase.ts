import { Inject, Injectable } from '@nestjs/common';
import type { QuestionRepositoryPort } from '../../../exams/domain/ports/question-repository.port';
import type { OptionGeneratorPort } from '../../domain/ports/option-generator.port';
import { OPTION_GENERATOR } from '../../../exams/tokens';
import { Question } from '../../../exams/domain/entities/question.entity';


export type GenerateOptionsInput = { questionId: string };

export type GenerateOptionsResult =
  | { result: 'options_generated'; questionId: string; options: string[] }
  | { result: 'invalid'; reason: 'wrong_status' | 'option_generation_failed' };

const MAX_OPTION_LENGTH = 500;
const REQUIRED_OPTIONS = 4;

@Injectable()
export class GenerateOptionsForQuestionUseCase {
  constructor(
    private readonly questionRepo: QuestionRepositoryPort,
    private readonly optionGenerator: OptionGeneratorPort,
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

    let generated: string[];
    try {
      generated = await this.optionGenerator.generateOptions(question.text);
    } catch (err) {
      const invalidQ = new Question(
        question.text,
        (question as any).type,
        (question as any).options ?? undefined,
        (question as any).source ?? undefined,
        (question as any).confidence ?? undefined,
        'invalid',
        (question as any).id,
        (question as any).createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    if (!Array.isArray(generated) || generated.length < REQUIRED_OPTIONS) {
      const invalidQ = new Question(
        question.text,
        (question as any).type,
        (question as any).options ?? undefined,
        (question as any).source ?? undefined,
        (question as any).confidence ?? undefined,
        'invalid',
        (question as any).id,
        (question as any).createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    const normalized = generated.slice(0, REQUIRED_OPTIONS).map((o) => (o ?? '').trim());

    const invalidOption = normalized.find((o) => !o || o.length === 0 || o.length > MAX_OPTION_LENGTH);
    if (invalidOption) {
      const invalidQ = new Question(
        question.text,
        (question as any).type,
        (question as any).options ?? undefined,
        (question as any).source ?? undefined,
        (question as any).confidence ?? undefined,
        'invalid',
        (question as any).id,
        (question as any).createdAt,
      );
      await this.questionRepo.save(invalidQ);
      return { result: 'invalid', reason: 'option_generation_failed' };
    }

    const updated = new Question(
      question.text,
      (question as any).type,
      normalized,
      (question as any).source ?? undefined,
      (question as any).confidence ?? undefined,
      'published',
      (question as any).id,
      (question as any).createdAt,
    );

    await this.questionRepo.save(updated);

    return { result: 'options_generated', questionId: updated.id, options: normalized };
  }
}
