export interface UploadDocumentResponseDto {
  message: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: Date;
}
