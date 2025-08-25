import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteClassDTO {
  @IsNotEmpty()
  @IsString()
  teacherId: string;
}
