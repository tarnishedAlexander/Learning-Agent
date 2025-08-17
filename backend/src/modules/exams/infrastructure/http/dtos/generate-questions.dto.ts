import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DistributionDto {
  @IsInt()
  @IsPositive()
  multiple_choice!: number;

  @IsInt()
  @IsPositive()
  true_false!: number;

  @IsInt()
  @IsPositive()
  open_analysis!: number;

  @IsInt()
  @IsPositive()
  open_exercise!: number;
}

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

  @ValidateNested()
  @Type(() => DistributionDto)
  distribution!: DistributionDto;
}