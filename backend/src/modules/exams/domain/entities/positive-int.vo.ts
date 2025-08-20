import { DomainError } from '../entities/domain-error';

export class PositiveInt {
  private constructor(private readonly value: number) {}

  static create(name: string, n: unknown): PositiveInt {
    const num = Number(n);
    if (!Number.isInteger(num) || num <= 0) {
      throw new DomainError(`${name} debe ser un entero positivo (> 0).`);
    }
    return new PositiveInt(num);
  }

  getValue(): number {
    return this.value;
  }
}
