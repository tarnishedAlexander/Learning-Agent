import { CreateCourseUseCase } from './create-course.usecase';
import { NotFoundError } from '../../../../shared/handler/errors';

describe('CreateCourseUseCase', () => {
  let useCase: CreateCourseUseCase;
  let courseRepo: any;
  let teacherRepo: any;

  beforeEach(() => {
    courseRepo = { create: jest.fn() };
    teacherRepo = { findByUserId: jest.fn() };

    useCase = new CreateCourseUseCase(courseRepo, teacherRepo);
  });

  it('should create a course when teacher exists', async () => {
    const input = { teacherId: 't1', name: 'Math' };
    const teacher = { userId: 't1' };
    const course = { id: 'c1', name: 'Math', teacherId: 't1' };

    teacherRepo.findByUserId.mockResolvedValue(teacher);
    courseRepo.create.mockResolvedValue(course);

    const result = await useCase.execute(input);

    expect(teacherRepo.findByUserId).toHaveBeenCalledWith('t1');
    expect(courseRepo.create).toHaveBeenCalledWith('Math', 't1');
    expect(result).toBe(course);
  });

  it('should throw NotFoundError if teacher does not exist', async () => {
    teacherRepo.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute({ teacherId: 't1', name: 'Math' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
