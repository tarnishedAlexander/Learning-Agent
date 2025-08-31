import { IsNotEmpty, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  teacherId: string;
  
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  semester: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateBegin: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateEnd: Date;
}
