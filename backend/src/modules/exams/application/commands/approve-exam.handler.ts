import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ApproveExamCommand } from './approve-exam.command';
import { EXAM_REPO } from '../../tokens';
import type { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';

@Injectable()
export class ApproveExamCommandHandler {
    constructor(@Inject(EXAM_REPO) private readonly examRepo: ExamRepositoryPort) {}

    async execute(cmd: ApproveExamCommand) {
        const exam = await this.examRepo.findById(cmd.examId);
        if (!exam) throw new NotFoundException('Exam not found');
        await this.examRepo.approve(cmd.examId);
        return { ok: true };
    }
}
