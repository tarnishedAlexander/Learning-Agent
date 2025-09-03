import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateExamQuestionDto {
    @IsOptional() @IsString() @MaxLength(4000)
    text?: string;

    @IsOptional() @IsArray()
    options?: string[];

    @IsOptional() @IsInt() @Min(0)
    correctOptionIndex?: number;

    @IsOptional() @IsBoolean()
    correctBoolean?: boolean;

    @IsOptional() @IsString()
    expectedAnswer?: string;
}
