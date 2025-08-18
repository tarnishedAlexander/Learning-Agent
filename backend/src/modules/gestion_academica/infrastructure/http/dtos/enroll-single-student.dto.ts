import { IsNotEmpty, IsString } from "class-validator";

export class EnrollSingleStudentDto {
    @IsNotEmpty()
    @IsString()
    studentName: string;

    @IsNotEmpty()
    @IsString()
    studentLastname: string;

    @IsNotEmpty()
    @IsString()
    studentCode: string;

    @IsNotEmpty()
    @IsString()
    classId: string;
}