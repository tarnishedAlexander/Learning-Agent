import { Inject, Injectable } from '@nestjs/common';
import { CLASSES_REPO, COURSE_REPO } from '../../tokens';
import type { ClassesRepositoryPort } from '../../domain/ports/classes.repository.ports';
import type { CourseRepositoryPort } from '../../domain/ports/courses.repository.ports';
import { Classes } from '../../domain/entities/classes.entity'
import { NotFoundError } from 'src/shared/handler/errors';

@Injectable()
export class CreateClassUseCase {
  constructor(
    @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
    @Inject(COURSE_REPO) private readonly courseRepo: CourseRepositoryPort,
  ) {}
  async execute(input: {
    courseId: string,
    semester: string,
    dateBegin: Date,
    dateEnd: Date
  }): Promise<Classes> {
    
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) {
      throw new NotFoundError(`Course not found with id ${input.courseId}`)
    }

    const className = `${course.name}-${input.semester}`

    return this.classRepo.create(
      className,
      input.semester,
      input.courseId,
      input.dateBegin,
      input.dateEnd
    );
  }
}
