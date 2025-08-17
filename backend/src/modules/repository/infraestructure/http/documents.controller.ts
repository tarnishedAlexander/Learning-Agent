import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadDocumentUseCase } from '../../application/commands/upload-document.usecase';
import { UploadResponseDto } from './dtos/upload-response.dto';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// fileFilter: accept only pdf
function pdfFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const isPdf =
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return cb(
      new HttpException('Only PDF files are allowed', HttpStatus.BAD_REQUEST),
    );
  }
  cb(null, true);
}

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly uploadUseCase: UploadDocumentUseCase) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: MAX_SIZE },
      fileFilter: pdfFileFilter,
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new HttpException(
        'No file provided or invalid file',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Additional validation (safety): check mimetype and size again
    if (file.size > MAX_SIZE) {
      throw new HttpException(
        'File too large. Max 10MB allowed',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
    if (
      !(
        file.mimetype === 'application/pdf' ||
        file.originalname.toLowerCase().endsWith('.pdf')
      )
    ) {
      throw new HttpException(
        'Only PDF files are allowed',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.uploadUseCase.execute(
        file.buffer,
        file.originalname,
        file.size,
        file.mimetype,
      );
      return result;
    } catch (err) {
      // Distinguish known errors if quieres
      throw new HttpException(
        `Upload failed: ${(err as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
