import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateStudentProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
