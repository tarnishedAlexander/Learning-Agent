import { Inject, Injectable } from '@nestjs/common';
import {CLASSES_REPO} from '../../tokens';
import type { ClassesRepositoryPort } from '../../domain/ports/classes.repository.ports';
import {Classes} from '../../domain/entities/classes.entity'

@Injectable()
export class ListClassesUseCase {
  constructor(
    @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
  ) {}
  async execute(): Promise<Classes[]> {
    return this.classRepo.list();
  }
}
