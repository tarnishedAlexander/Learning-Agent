import { IsNotEmpty, IsString } from "class-validator";

export class CreateCourseDTO {
    @IsNotEmpty()
    @IsString()
    teacherId: string;

    @IsNotEmpty()
    @IsString()
    name: string;
}