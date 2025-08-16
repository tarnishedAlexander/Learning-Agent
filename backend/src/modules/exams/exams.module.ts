import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { EXAM_REPO } from './tokens';
import { ExamPrismaRepository } from './infrastructure/persistence/exam.prisma.repository';
import { ExamsController } from './infrastructure/http/exams.controller';
import { CreateExamCommandHandler } from './application/commands/create-exam.command';

@Module({
  imports: [PrismaModule],
  controllers: [ExamsController],
  providers: [
    { provide: EXAM_REPO, useClass: ExamPrismaRepository },
    CreateExamCommandHandler,
  ],
})
export class ExamsModule {}
