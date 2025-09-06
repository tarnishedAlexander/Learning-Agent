import { GenerateOptionsForQuestionUseCase, GenerateOptionsResult } from '../usecases/generate-options-for-question.usecase';
import { AIQuestionGenerator } from '../../infrastructure/ai/ai-question.generator';

describe('GenerateOptionsForQuestionUseCase', () => {
  let useCase: GenerateOptionsForQuestionUseCase;

  beforeEach(() => {
    const mockAI: Partial<AIQuestionGenerator> = {
      generateOptions: async (text: string) => ({
        options: [
          `${text} — opción A`,
          `${text} — opción B`,
          `${text} — opción C`,
          `${text} — opción D`
        ],
        correctIndex: null,
        confidence: null
      })
    };
    useCase = new GenerateOptionsForQuestionUseCase(mockAI as AIQuestionGenerator);
  });

  it('should generate a question with 4 related options', async () => {
    const result: GenerateOptionsResult = await useCase.execute();
    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('options');
    expect(result.options.length).toBe(4);
    result.options.forEach(option => expect(option).toContain(result.question));
  });
});