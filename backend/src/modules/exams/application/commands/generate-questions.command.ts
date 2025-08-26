import { Inject } from '@nestjs/common';
import { EXAM_AI_GENERATOR } from '../../tokens';
import type { AIQuestionGeneratorPort } from '../../domain/ports/ai-question-generator.port';
import { DistributionVO, type Distribution } from '../../domain/entities/distribution.vo';

export class GenerateQuestionsCommand {
  constructor(
    public readonly subject: string,
    public readonly difficulty: 'fácil' | 'medio' | 'difícil',
    public readonly totalQuestions: number,
    public readonly reference?: string | null,
    public readonly distribution?: Distribution,
  ) {}
}

export class GenerateQuestionsCommandHandler {
  constructor(
    @Inject(EXAM_AI_GENERATOR) private readonly ai: AIQuestionGeneratorPort,
  ) {}

  async execute(cmd: GenerateQuestionsCommand) {
    const questions = await this.ai.generate({
      subject: cmd.subject,
      difficulty: cmd.difficulty,
      totalQuestions: cmd.totalQuestions,
      reference: cmd.reference ?? null,
      distribution: cmd.distribution,
    });

    return questions;
  }
}
