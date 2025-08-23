import { IsNotEmpty, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  semester: string;

  @IsNotEmpty()
  @IsString()
  teacherId: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateBegin: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateEnd: Date;
}
