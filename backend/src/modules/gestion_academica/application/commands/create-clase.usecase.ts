import { Inject, Injectable } from '@nestjs/common';
import {CLASSES_REPO} from '../../tokens';
import type { ClassesRepositoryPort } from '../../domain/ports/classes.repository.ports';
import {Classes} from '../../domain/entities/classes.entity'

@Injectable()
export class CreateClassUseCase {
  constructor(
    @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
  ) {}
  async execute(input: {
    name: string, 
    semester: string, 
    teacherId: string,
    dateBegin: Date,
    dateEnd: Date
  }): Promise<Classes> {

    return this.classRepo.create(
      input.name, 
      input.semester, 
      input.teacherId,
      input.dateBegin,
      input.dateEnd
    );
  }
}
