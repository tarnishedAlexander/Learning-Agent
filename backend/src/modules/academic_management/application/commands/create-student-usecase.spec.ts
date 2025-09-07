import { CreateStudentUseCase } from './create-student.usecase';
import { Student } from '../../domain/entities/student.entity';

describe('CreateStudentUseCase', () => {
  let useCase: CreateStudentUseCase;
  let studentRepo: any;

  beforeEach(() => {
    studentRepo = { create: jest.fn() };
    useCase = new CreateStudentUseCase(studentRepo);
  });

  it('should create a student with all fields provided', async () => {
    const input = { userId: 'u1', code: 'S001', career: 'CS', admissionYear: 2025 };
    const createdStudent: Student = { userId: 'u1', code: 'S001', career: 'CS', admissionYear: 2025 };

    studentRepo.create.mockResolvedValue(createdStudent);

    const result = await useCase.execute(input);

    expect(studentRepo.create).toHaveBeenCalledWith('u1', 'S001', 'CS', 2025);
    expect(result).toBe(createdStudent);
  });

  it('should create a student with optional fields undefined', async () => {
    const input = { userId: 'u2', code: 'S002' };
    const createdStudent: Student = { userId: 'u2', code: 'S002', career: undefined, admissionYear: undefined };

    studentRepo.create.mockResolvedValue(createdStudent);

    const result = await useCase.execute(input);

    expect(studentRepo.create).toHaveBeenCalledWith('u2', 'S002', undefined, undefined);
    expect(result).toBe(createdStudent);
  });
});
