import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsIn(['fácil', 'medio', 'difícil'])
  difficulty!: 'fácil' | 'medio' | 'difícil';

  @IsInt()
  @IsPositive()
  totalQuestions!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reference?: string;

  @IsOptional()
  @IsIn(['open', 'multiple_choice', 'mixed'])
  preferredType?: 'open' | 'multiple_choice' | 'mixed';
}
