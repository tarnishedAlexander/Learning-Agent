export class DocumentListItemDto {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: Date;

  constructor(
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    downloadUrl: string,
    uploadedAt: Date,
  ) {
    this.fileName = fileName;
    this.originalName = originalName;
    this.mimeType = mimeType;
    this.size = size;
    this.downloadUrl = downloadUrl;
    this.uploadedAt = uploadedAt;
  }
}

export class DocumentListResponseDto {
  documents: DocumentListItemDto[];
  total: number;
  message: string;

  constructor(
    documents: DocumentListItemDto[],
    total: number,
    message: string,
  ) {
    this.documents = documents;
    this.total = total;
    this.message = message;
  }
}

export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;
  details: string;

  constructor(
    statusCode: number,
    message: string,
    error: string,
    details: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.details = details;
  }
}
