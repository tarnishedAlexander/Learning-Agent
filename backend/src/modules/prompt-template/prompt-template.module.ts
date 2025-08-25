import { Module } from '@nestjs/common';
import { PROMPT_TEMPLATE_PORT } from './tokens';
import { FsTemplateAdapter } from './infrastructure/fs-template.adapter';

@Module({
  providers: [{ provide: PROMPT_TEMPLATE_PORT, useClass: FsTemplateAdapter }],
  exports: [PROMPT_TEMPLATE_PORT],
})
export class PromptTemplateModule {}
