import { IsNotEmpty, IsString } from "class-validator";

export class CreateEnrollmentDto {
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @IsNotEmpty()
    @IsString()
    classId: string;
}