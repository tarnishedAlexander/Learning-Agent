/**
 * Response DTO for document similarity check
 */
export class CheckDocumentSimilarityResponseDto {
  constructor(
    public readonly status: 'exact_match' | 'text_hash_match' | 'text_match' | 'candidates' | 'no_match',
    public readonly message: string,
    public readonly existingDocument?: ExistingDocumentDto,
    public readonly similarCandidates?: SimilarDocumentDto[],
  ) {}
}

/**
 * DTO for existing document that matches
 */
export class ExistingDocumentDto {
  constructor(
    public readonly id: string,
    public readonly originalName: string,
    public readonly documentTitle: string | null,
    public readonly documentAuthor: string | null,
    public readonly uploadedAt: Date,
    public readonly uploadedBy: string,
    public readonly matchType: 'binary_hash' | 'text_hash',
  ) {}
}

/**
 * DTO for similar document candidate
 */
export class SimilarDocumentDto {
  constructor(
    public readonly id: string,
    public readonly originalName: string,
    public readonly documentTitle: string | null,
    public readonly documentAuthor: string | null,
    public readonly uploadedAt: Date,
    public readonly uploadedBy: string,
    public readonly similarityScore: number,
    public readonly details: {
      avgSimilarity: number;
      coverage: number;
      matchedChunks: number;
      totalChunks: number;
    },
  ) {}
}

/**
 * Request DTO for document similarity check
 */
export class CheckDocumentSimilarityRequestDto {
  constructor(
    public readonly skipEmbeddings?: boolean,
    public readonly similarityThreshold?: number,
    public readonly maxCandidates?: number,
    public readonly useSampling?: boolean,
  ) {}
}

/**
 * Response DTO for upload with confirmation required
 */
export class UploadWithConfirmationResponseDto {
  constructor(
    public readonly status: 'confirm_required',
    public readonly message: string,
    public readonly fileHash: string,
    public readonly similarDocuments: SimilarDocumentDto[],
    public readonly uploadData: {
      originalName: string;
      size: number;
      mimeType: string;
    },
  ) {}
}

/**
 * Request DTO for confirming upload
 */
export class ConfirmUploadRequestDto {
  constructor(
    public readonly fileHash: string,
    public readonly forceSave: boolean,
    public readonly userId: string,
  ) {}
}