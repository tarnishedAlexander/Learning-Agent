import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiConfigService } from '../../core/ai/ai.config';
import { LlmModule } from '../llm/llm.module';
import { PromptTemplateModule } from '../prompt-template/prompt-template.module';
import { ChatController } from './infrastructure/httpchat/chat.controller';
import { DeepSeekService } from './domain/services/deepseek/deepseek.service';

@Module({
  imports: [PrismaModule, LlmModule, PromptTemplateModule],
  controllers: [ChatController],
  providers: [
    // persistencia
    //{ provide: EXAM_REPO, useClass: ExamPrismaRepository },
    // adaptador IA
    AiConfigService,
    DeepSeekService,
    //CreateExamCommandHandler,
  ],
})
export class ReinforcementModule {}
