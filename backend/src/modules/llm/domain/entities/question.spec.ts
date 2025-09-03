import { Question } from './question';

describe('Question Entity', () => {
  it('should create a valid question', () => {
    const q = Question.create('¿Qué es arquitectura hexagonal?');
    expect(q.id).toBeDefined();
    expect(q.content).toBe('¿Qué es arquitectura hexagonal?');
    expect(q.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error when content is empty', () => {
    expect(() => Question.create('')).toThrow();
  });
});
