import { ProcessingJob, ProcessingType, ProcessingStatus } from '../entities/processing-job.entity';

export class ProcessingJobService {
  /**
   * Crea un nuevo job de procesamiento
   */
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

  /**
   * Marca el job como iniciado
   */
  static start(job: ProcessingJob): ProcessingJob {
    if (job.status !== ProcessingStatus.PENDING && job.status !== ProcessingStatus.RETRYING) {
      throw new Error(`Cannot start job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.RUNNING,
      job.progress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      new Date(),
      job.completedAt,
      job.createdAt,
    );
  }

  /**
   * Actualiza el progreso del job
   */
  static updateProgress(job: ProcessingJob, progress: number): ProcessingJob {
    if (!this.isRunning(job)) {
      throw new Error(`Cannot update progress for job in status: ${job.status}`);
    }

    const validProgress = Math.max(0, Math.min(100, progress));

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      job.status,
      validProgress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      job.completedAt,
      job.createdAt,
    );
  }

  /**
   * Marca el job como completado exitosamente
   */
  static complete(job: ProcessingJob, result?: Record<string, any>): ProcessingJob {
    if (!this.isRunning(job)) {
      throw new Error(`Cannot complete job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.COMPLETED,
      100,
      job.errorMessage,
      job.jobDetails,
      result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Marca el job como fallido
   */
  static fail(job: ProcessingJob, errorMessage: string): ProcessingJob {
    if (this.isTerminal(job)) {
      throw new Error(`Cannot fail job in terminal status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.FAILED,
      job.progress,
      errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Cancela el job
   */
  static cancel(job: ProcessingJob): ProcessingJob {
    if (this.isTerminal(job)) {
      throw new Error(`Cannot cancel job in terminal status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.CANCELLED,
      job.progress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Marca el job para reintento
   */
  static retry(job: ProcessingJob): ProcessingJob {
    if (!this.canRetry(job)) {
      throw new Error(`Cannot retry job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.RETRYING,
      0,
      undefined,
      job.jobDetails,
      undefined,
      undefined,
      undefined,
      job.createdAt,
    );
  }

  /**
   * Verifica si el job está en estado terminal (completado o fallido)
   */
  static isTerminal(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.COMPLETED ||
      job.status === ProcessingStatus.FAILED ||
      job.status === ProcessingStatus.CANCELLED
    );
  }

  /**
   * Verifica si el job está en ejecución
   */
  static isRunning(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.RUNNING;
  }

  /**
   * Verifica si el job puede ser reintentado
   */
  static canRetry(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.FAILED;
  }

  /**
   * Verifica si el job está pendiente
   */
  static isPending(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.PENDING || job.status === ProcessingStatus.RETRYING;
  }

  /**
   * Calcula el tiempo de ejecución del job
   */
  static getExecutionTime(job: ProcessingJob): number | null {
    if (!job.startedAt) return null;
    
    const endTime = job.completedAt || new Date();
    return endTime.getTime() - job.startedAt.getTime();
  }

  /**
   * Valida las transiciones de estado
   */
  static canTransitionTo(currentStatus: ProcessingStatus, newStatus: ProcessingStatus): boolean {
    const validTransitions: Record<ProcessingStatus, ProcessingStatus[]> = {
      [ProcessingStatus.PENDING]: [ProcessingStatus.RUNNING, ProcessingStatus.CANCELLED],
      [ProcessingStatus.RUNNING]: [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED, ProcessingStatus.CANCELLED],
      [ProcessingStatus.COMPLETED]: [],
      [ProcessingStatus.FAILED]: [ProcessingStatus.RETRYING],
      [ProcessingStatus.CANCELLED]: [],
      [ProcessingStatus.RETRYING]: [ProcessingStatus.RUNNING, ProcessingStatus.CANCELLED],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}