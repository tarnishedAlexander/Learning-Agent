import { IsNotEmpty, IsString } from "class-validator";

export class EnrollGroupStudentDTO {
    @IsNotEmpty()
    @IsString()
    classId: string;

    @IsNotEmpty()
    studentRows: EnrollGroupStudentRow[];
}

export class EnrollGroupStudentRow {
    @IsNotEmpty()
    @IsString()
    studentName: string;

    @IsNotEmpty()
    @IsString()
    studentLastname: string;

    @IsNotEmpty()
    @IsString()
    studentCode: string;
} 