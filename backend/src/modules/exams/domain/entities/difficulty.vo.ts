import { DomainError } from '../entities/domain-error';

export type DifficultyType = 'fácil' | 'medio' | 'difícil';

export class Difficulty {
  private constructor(private readonly value: DifficultyType) {}

  static readonly allowed: DifficultyType[] = ['fácil', 'medio', 'difícil'];

  static create(input: string): Difficulty {
    const normalized = input?.toLowerCase()?.trim() as DifficultyType;
    if (!Difficulty.allowed.includes(normalized)) {
      throw new DomainError(
        'La dificultad debe ser "fácil", "medio" o "difícil".'
      );
    }
    return new Difficulty(normalized);
  }

  getValue(): DifficultyType {
    return this.value;
  }
}
