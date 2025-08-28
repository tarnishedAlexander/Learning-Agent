export class ProcessingJob {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly jobType: ProcessingType,
    public readonly status: ProcessingStatus = ProcessingStatus.PENDING,
    public readonly progress: number = 0,
    public readonly errorMessage?: string,
    public readonly jobDetails?: Record<string, any>,
    public readonly result?: Record<string, any>,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    documentId: string,
    jobType: ProcessingType,
    jobDetails?: Record<string, any>,
  ): ProcessingJob {
    return new ProcessingJob(
      id,
      documentId,
      jobType,
      ProcessingStatus.PENDING,
      0,
      undefined,
      jobDetails,
    );
  }

  start(): ProcessingJob {
    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.RUNNING,
      this.progress,
      this.errorMessage,
      this.jobDetails,
      this.result,
      new Date(),
      this.completedAt,
      this.createdAt,
    );
  }

  updateProgress(progress: number): ProcessingJob {
    const validProgress = Math.max(0, Math.min(100, progress));

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      this.status,
      validProgress,
      this.errorMessage,
      this.jobDetails,
      this.result,
      this.startedAt,
      this.completedAt,
      this.createdAt,
    );
  }

  complete(result?: Record<string, any>): ProcessingJob {
    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.COMPLETED,
      100,
      this.errorMessage,
      this.jobDetails,
      result,
      this.startedAt,
      new Date(),
      this.createdAt,
    );
  }

  fail(errorMessage: string): ProcessingJob {
    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.FAILED,
      this.progress,
      errorMessage,
      this.jobDetails,
      this.result,
      this.startedAt,
      new Date(),
      this.createdAt,
    );
  }

  isTerminal(): boolean {
    return (
      this.status === ProcessingStatus.COMPLETED ||
      this.status === ProcessingStatus.FAILED ||
      this.status === ProcessingStatus.CANCELLED
    );
  }

  isRunning(): boolean {
    return this.status === ProcessingStatus.RUNNING;
  }

  canRetry(): boolean {
    return this.status === ProcessingStatus.FAILED;
  }
}

export enum ProcessingType {
  TEXT_EXTRACTION = 'TEXT_EXTRACTION',
  CHUNKING = 'CHUNKING',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  FULL_PROCESSING = 'FULL_PROCESSING',
  REPROCESSING = 'REPROCESSING',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING',
}