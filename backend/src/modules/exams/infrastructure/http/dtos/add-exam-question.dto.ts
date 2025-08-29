import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddExamQuestionDto {
  @IsEnum(['MULTIPLE_CHOICE','TRUE_FALSE','OPEN_ANALYSIS','OPEN_EXERCISE'] as any)
  kind!: 'MULTIPLE_CHOICE'|'TRUE_FALSE'|'OPEN_ANALYSIS'|'OPEN_EXERCISE';

  @IsString() @IsNotEmpty() @MaxLength(4000)
  text!: string;

  // MCQ
  @IsOptional() @IsArray()
  options?: string[];

  @IsOptional() @IsInt() @Min(0)
  correctOptionIndex?: number;

  // TRUE_FALSE
  @IsOptional() @IsBoolean()
  correctBoolean?: boolean;

  // OPEN_*
  @IsOptional() @IsString()
  expectedAnswer?: string;

  @IsIn(['start','middle','end'])
  position!: 'start'|'middle'|'end';
}
