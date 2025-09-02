import { IsNotEmpty, IsString } from 'class-validator';

export class ChatAnswer {
  @IsNotEmpty({ message: 'La pregunta es obligatoria' })
  @IsString({ message: 'La pregunta debe ser texto' })
  question: string;
  @IsNotEmpty({ message: 'La pregunta es obligatoria' })
  @IsString({ message: 'La pregunta debe ser texto' })
  answer: string;
  @IsNotEmpty({ message: 'La pregunta es obligatoria' })
  @IsString({ message: 'La pregunta debe ser texto' })
  topic: string;
}
