export class UploadResponseDto {
  id: string;
  originalName: string;
  storedName: string;
  s3Key: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  url?: string;
}
