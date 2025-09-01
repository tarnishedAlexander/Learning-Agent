import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiConfigService } from '../../core/ai/ai.config';
import { LlmModule } from '../llm/llm.module';
import { PromptTemplateModule } from '../prompt-template/prompt-template.module';
import { ChatInterviewService } from './domain/services/openai/chat.service';
import { ChatIntController } from './infrastructure/httpchat/chatInt.controller';

@Module({
  imports: [PrismaModule, LlmModule, PromptTemplateModule],
  controllers: [ChatIntController],
  providers: [
    // persistencia
    //{ provide: EXAM_REPO, useClass: ExamPrismaRepository },
    // adaptador IA
    AiConfigService,
    ChatInterviewService,
    //CreateExamCommandHandler,
  ],
})
export class InterviewModule {}
