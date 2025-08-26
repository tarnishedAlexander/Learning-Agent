import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteDocumentParamDto {
  @IsString()
  @IsNotEmpty()
  filename: string;
}

export class DeleteDocumentResponseDto {
  @IsString()
  message: string;

  @IsString()
  filename: string;

  @IsString()
  deletedAt: string;

  constructor(message: string, filename: string, deletedAt: string) {
    this.message = message;
    this.filename = filename;
    this.deletedAt = deletedAt;
  }
}

export class DeleteDocumentErrorDto {
  @IsString()
  error: string;

  @IsString()
  message: string;

  @IsString()
  filename: string;

  constructor(error: string, message: string, filename: string) {
    this.error = error;
    this.message = message;
    this.filename = filename;
  }
}
