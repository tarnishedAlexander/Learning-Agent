import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AskDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsIn(['es', 'en'])
  lang!: 'es' | 'en';

  @IsString()
  @IsIn(['academic_general'])
  context!: 'academic_general';
}
