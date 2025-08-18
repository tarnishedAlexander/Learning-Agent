import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";

@Injectable()
export class GetClassByIdUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
    ) {}

    async execute(classId: string): Promise<Classes | null> {
        const ojbClass = await this.classesRepo.findById(classId);
        if (ojbClass?.isActive) return ojbClass;
        return null;
    }
}