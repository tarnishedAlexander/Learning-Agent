import { PublishGeneratedQuestionUseCase } from '../usecases/publish-generated-question.usecase';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import * as QuestionEntity from '../../domain/entities/question.entity';

describe('PublishGeneratedQuestionUseCase', () => {
  let repoMock: jest.Mocked<QuestionRepositoryPort>;
  let useCase: PublishGeneratedQuestionUseCase;

  beforeEach(() => {
    repoMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepositoryPort>;

    useCase = new PublishGeneratedQuestionUseCase(repoMock);
  });

  it('creates a question when input is new and confidence is high', async () => {
    const txt = 'What is architecture?';
    repoMock.findAll.mockResolvedValue([]);
    const fakeQ = QuestionEntity.Question.create(txt);
    repoMock.save.mockResolvedValue(fakeQ);

    const res = await useCase.execute({ text: txt, confidence: 0.9 });

    expect(repoMock.findAll).toHaveBeenCalled();
    expect(repoMock.save).toHaveBeenCalledWith(expect.any(QuestionEntity.Question));
    expect(res).toEqual({ result: 'created', questionId: fakeQ.id });
  });

  it('returns duplicate when normalized text already exists', async () => {
    const txt = '<p>Hello</p>';
    const existing = QuestionEntity.Question.create('Hello');
    repoMock.findAll.mockResolvedValue([existing]);

    const res = await useCase.execute({ text: txt, confidence: 1 });

    expect(repoMock.findAll).toHaveBeenCalled();
    expect(repoMock.save).not.toHaveBeenCalled();
    expect(res).toEqual({ result: 'duplicate' });
  });

  it('persists but returns invalid when confidence below threshold', async () => {
    const txt = 'Low confidence question';
    repoMock.findAll.mockResolvedValue([]);
    const fakeQ = QuestionEntity.Question.create(txt);
    repoMock.save.mockResolvedValue(fakeQ);

    const prev = process.env.MIN_CONFIDENCE;
    process.env.MIN_CONFIDENCE = '0.8';

    const res = await useCase.execute({ text: txt, confidence: 0.5 });

    process.env.MIN_CONFIDENCE = prev;

    expect(repoMock.save).toHaveBeenCalled();
    expect(res).toEqual({ result: 'invalid', questionId: fakeQ.id });
  });
});
