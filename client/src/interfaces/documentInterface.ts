export interface Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
}

export interface DocumentListResponse {
  success: boolean;
  data: {
    documents: Document[];
    totalCount: number;
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    uploadedAt: string;
  };
}