import { Inject } from '@nestjs/common';
import { ExamFactory } from '../../domain/entities/exam.factory';
import { EXAM_AI_GENERATOR } from '../../tokens';
import type { AIQuestionGeneratorPort } from '../../domain/ports/ai-question-generator.port';

export class GenerateQuestionsCommand {
  constructor(
    public readonly subject: string,
    public readonly difficulty: 'fácil' | 'medio' | 'difícil',
    public readonly totalQuestions: number,
    public readonly reference?: string | null,
    public readonly preferredType?: 'open' | 'multiple_choice' | 'mixed',
  ) {}
}

export class GenerateQuestionsCommandHandler {
  constructor(
    @Inject(EXAM_AI_GENERATOR) private readonly ai: AIQuestionGeneratorPort,
  ) {}

  async execute(cmd: GenerateQuestionsCommand) {
    ExamFactory.create({
      subject: cmd.subject,
      difficulty: cmd.difficulty,
      attempts: 1, 
      totalQuestions: cmd.totalQuestions,
      timeMinutes: 1,
      reference: cmd.reference ?? null,
    });

    const questions = await this.ai.generate({
      subject: cmd.subject,
      difficulty: cmd.difficulty,
      totalQuestions: cmd.totalQuestions,
      reference: cmd.reference ?? null,
      preferredType: cmd.preferredType ?? 'mixed',
    });

    return questions.map(q => q.toJSON());
  }
}
