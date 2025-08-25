import { Inject, Injectable } from '@nestjs/common';
import { LLM_PORT } from '../../../llm/tokens';
import type { LlmPort } from '../../../llm/domain/ports/llm.port';
import type { PromptTemplatePort } from '../../../prompt-template/domain/ports/prompt-template.port';
import { PROMPT_TEMPLATE_PORT } from '../../../prompt-template/tokens';
import {
  GenerateExamInput,
  GeneratedExamResult,
} from '../../infrastructure/http/dtos/exam.types';

@Injectable()
export class GenerateExamUseCase {
  constructor(
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    @Inject(PROMPT_TEMPLATE_PORT)
    private readonly templates: PromptTemplatePort,
  ) {}

  async execute(input: GenerateExamInput): Promise<GeneratedExamResult> {
    const prompt = await this.templates.render(input.templateId, {
      subject: input.subject,
      level: input.level,
      numQuestions: input.numQuestions,
      format: input.format ?? 'json',
      ...input.extra,
    });

    const model = input.model ?? {
      provider: process.env.LLM_PROVIDER ?? 'ollama',
      name: process.env.LLM_MODEL ?? 'llama2',
    };

    const out = await this.llm.complete(prompt, {
      model,
      temperature: 0.2,
      maxTokens: 2048,
      vendorOptions: {
        response_format: input.format === 'json' ? 'json' : undefined,
      },
    });

    return { output: out.text, provider: model.provider, model: model.name };
  }
}
