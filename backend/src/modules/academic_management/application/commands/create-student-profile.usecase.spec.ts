import { CreateStudentProfileUseCase } from './create-student-profile.usecase';
import { Student } from '../../domain/entities/student.entity';

describe('CreateStudentProfileUseCase', () => {
  let useCase: CreateStudentProfileUseCase;
  let userRepo: any;
  let studentRepo: any;

  beforeEach(() => {
    userRepo = { findByEmail: jest.fn(), create: jest.fn() };
    studentRepo = { findByCode: jest.fn(), create: jest.fn() };

    useCase = new CreateStudentProfileUseCase(userRepo, studentRepo);
  });

  it('should return existing student if found by code', async () => {
    const input = { name: 'John', lastname: 'Doe', email: 'john@example.com', password: '123', code: 'S001' };
    const existingStudent: Student = { userId: 'stu1', code: '14001', career: 'sistemas', admissionYear: 2020};

    studentRepo.findByCode.mockResolvedValue(existingStudent);

    const result = await useCase.execute(input);

    expect(studentRepo.findByCode).toHaveBeenCalledWith('S001');
    expect(result).toBe(existingStudent);
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(studentRepo.create).not.toHaveBeenCalled();
  });

  it('should create user and student if not existing', async () => {
    const input = { name: 'Jane', lastname: 'Smith', email: 'jane@example.com', password: '123', code: 'S002', career: 'CS', admissionYear: 2025 };
    const createdUser = { id: 'u1' };
    const createdStudent: Student = { userId: 'stu2', code: '12001', career: 'sistemas', admissionYear: 2020 };

    studentRepo.findByCode.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(createdUser);
    studentRepo.create.mockResolvedValue(createdStudent);

    const result = await useCase.execute(input);

    expect(userRepo.create).toHaveBeenCalledWith('Jane', 'Smith', 'jane@example.com', '123', true);
    expect(studentRepo.create).toHaveBeenCalledWith('u1', 'S002', 'CS', 2025);
    expect(result).toBe(createdStudent);
  });

  it('should reuse existing user if email exists', async () => {
    const input = { name: 'Jane', lastname: 'Smith', email: 'jane@example.com', password: '123', code: 'S003' };
    const existingUser = { id: 'u2' };
    const createdStudent: Student = { userId: 'stu3', code: '13001', career: 'sistemas', admissionYear: 2019};

    studentRepo.findByCode.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(existingUser);
    studentRepo.create.mockResolvedValue(createdStudent);

    const result = await useCase.execute(input);

    expect(userRepo.create).not.toHaveBeenCalled();
    expect(studentRepo.create).toHaveBeenCalledWith('u2', 'S003', undefined, undefined);
    expect(result).toBe(createdStudent);
  });
});
