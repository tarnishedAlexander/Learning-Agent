import { GenerateOptionsForQuestionUseCase } from '../usecases/generate-options-for-question.usecase';
import type { QuestionRepositoryPort } from '../../../exams/domain/ports/question-repository.port';
import type { OptionGeneratorPort } from '../../domain/ports/option-generator.port';
import { Question } from '../../../exams/domain/entities/question.entity';

describe('GenerateOptionsForQuestionUseCase', () => {
  let repoMock: jest.Mocked<QuestionRepositoryPort>;
  let generatorMock: jest.Mocked<OptionGeneratorPort>;
  let useCase: GenerateOptionsForQuestionUseCase;

  beforeEach(() => {
    repoMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepositoryPort>;

    generatorMock = {
      generateOptions: jest.fn(),
    } as unknown as jest.Mocked<OptionGeneratorPort>;

    useCase = new GenerateOptionsForQuestionUseCase(repoMock, generatorMock);
  });

  it('generates 4 options and persists -> returns options_generated', async () => {
    const q = Question.create('¿Qué es arquitectura?', 'open_analysis', undefined, undefined, 1, 'generated');
    repoMock.findById.mockResolvedValue(q);

    const opts = ['A', 'B', 'C', 'D'];
    generatorMock.generateOptions.mockResolvedValue(opts);

    const updated = new Question(q.text, q.type, opts, q.source, q.confidence, 'published', q.id, q.createdAt);
    repoMock.save.mockResolvedValue(updated);

    const res = await useCase.execute({ questionId: q.id });

    expect(generatorMock.generateOptions).toHaveBeenCalledWith(q.text);
    expect(repoMock.save).toHaveBeenCalledWith(expect.any(Question));
    expect(res).toEqual({ result: 'options_generated', questionId: q.id, options: opts });
  });

  it('throws when question not found', async () => {
    repoMock.findById.mockResolvedValue(null);
    await expect(useCase.execute({ questionId: 'nope' })).rejects.toThrow('Question not found');
    expect(generatorMock.generateOptions).not.toHaveBeenCalled();
  });

  it('returns invalid when question status is not generated', async () => {
    const q = Question.create('Text', 'open_analysis', undefined, undefined, 1, 'published');
    repoMock.findById.mockResolvedValue(q);

    const res = await useCase.execute({ questionId: q.id });
    expect(res).toEqual({ result: 'invalid', reason: 'wrong_status' });
    expect(generatorMock.generateOptions).not.toHaveBeenCalled();
  });

  it('returns invalid when generator returns less than 4', async () => {
    const q = Question.create('Text', 'open_analysis', undefined, undefined, 1, 'generated');
    repoMock.findById.mockResolvedValue(q);

    generatorMock.generateOptions.mockResolvedValue(['A', 'B', 'C']);

    const res = await useCase.execute({ questionId: q.id });

    expect(repoMock.save).toHaveBeenCalled();
    expect(res).toEqual({ result: 'invalid', reason: 'option_generation_failed' });
  });

  it('returns invalid when generator throws', async () => {
    const q = Question.create('Text', 'open_analysis', undefined, undefined, 1, 'generated');
    repoMock.findById.mockResolvedValue(q);

    generatorMock.generateOptions.mockRejectedValue(new Error('AI down'));

    const res = await useCase.execute({ questionId: q.id });

    expect(repoMock.save).toHaveBeenCalled();
    expect(res).toEqual({ result: 'invalid', reason: 'option_generation_failed' });
  });
});
