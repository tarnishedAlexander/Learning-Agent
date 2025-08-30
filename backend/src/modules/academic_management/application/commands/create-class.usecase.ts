import { Inject, Injectable } from '@nestjs/common';
import { CLASSES_REPO, COURSE_REPO, TEACHER_REPO } from '../../tokens';
import type { ClassesRepositoryPort } from '../../domain/ports/classes.repository.ports';
import type { CourseRepositoryPort } from '../../domain/ports/courses.repository.ports';
import type { ProfessorRepositoryPort } from '../../domain/ports/teacher.repository.ports';
import { Classes } from '../../domain/entities/classes.entity'
import { ForbiddenError, NotFoundError } from 'src/shared/handler/errors';

@Injectable()
export class CreateClassUseCase {
  constructor(
    @Inject(TEACHER_REPO) private readonly teacherRepo: ProfessorRepositoryPort,
    @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
    @Inject(COURSE_REPO) private readonly courseRepo: CourseRepositoryPort,
  ) {}
  async execute(input: {
    teacherId: string,
    courseId: string,
    semester: string,
    dateBegin: Date,
    dateEnd: Date
  }): Promise<Classes> {
    const teacher = await this.teacherRepo.findByUserId(input.teacherId)
    if (!teacher) {
      throw new NotFoundError(`Teacher not found with id ${input.teacherId}`)
    }
    
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) {
      throw new NotFoundError(`Course not found with id ${input.courseId}`)
    }

    if (course.teacherId != teacher.userId) {
      throw new ForbiddenError(`Course ${course.id} doesnt belongs to teacher ${teacher.userId}`)
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
