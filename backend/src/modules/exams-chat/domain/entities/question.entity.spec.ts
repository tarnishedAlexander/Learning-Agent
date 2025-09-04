import { Question } from '../../../exams-chat/domain/entities/question.entity';

describe('Question Entity', () => {
  it('should create a valid question', () => {
    const q = new Question('¿Qué es arquitectura hexagonal?');
    expect(q.id).toBeDefined();
    expect(q.text).toBe('¿Qué es arquitectura hexagonal?');
    expect(q.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error when content is empty', () => {
    expect(() => new Question('')).toThrow();
  });
});
