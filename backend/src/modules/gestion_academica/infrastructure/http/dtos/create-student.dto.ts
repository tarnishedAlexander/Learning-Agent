import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsNumber()
  admissionYear?: number;
}
