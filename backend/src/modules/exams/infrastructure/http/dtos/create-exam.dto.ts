import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty({ message: 'Materia es obligatoria.' })
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsIn(['fácil', 'medio', 'difícil'], { message: 'Dificultad inválida.' })
  difficulty!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reference?: string;

  @IsInt()
  @IsPositive({ message: 'Intentos debe ser > 0.' })
  attempts!: number;

  @IsInt()
  @IsPositive({ message: 'Total de preguntas debe ser > 0.' })
  totalQuestions!: number;

  @IsInt()
  @IsPositive({ message: 'Tiempo (minutos) debe ser > 0.' })
  timeMinutes!: number;
}
