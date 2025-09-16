import { Injectable, Logger } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import type { DocumentIndexGeneratorPort } from '../../domain/ports/document-index-generator.port';
import type { DocumentIndexRepositoryPort } from '../../domain/ports/document-index-repository.port';
import { DocumentIndex } from '../../domain/entities/document-index.entity';

export interface GenerateDocumentIndexCommand {
  documentId: string;
  config?: any;
}

@Injectable()
export class GenerateDocumentIndexUseCase {
  private readonly logger = new Logger(GenerateDocumentIndexUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
    private readonly indexGenerator: DocumentIndexGeneratorPort,
    private readonly documentIndexRepository: DocumentIndexRepositoryPort,
  ) {}

  async execute(command: GenerateDocumentIndexCommand): Promise<DocumentIndex> {
    const { documentId, config } = command;

    try {
      this.logger.log(
        `Iniciando generación de índice para documento: ${documentId}`,
      );

      // 1. Verificar que el documento existe
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        throw new Error(`Documento con ID ${documentId} no encontrado`);
      }

      this.logger.log(`Documento encontrado: ${document.originalName}`);

      // 2. Obtener todos los chunks del documento (sin límite)
      const chunksResult = await this.chunkRepository.findByDocumentId(
        documentId,
        { limit: 10000 },
      );
      if (
        !chunksResult ||
        !chunksResult.chunks ||
        chunksResult.chunks.length === 0
      ) {
        throw new Error(
          `No se encontraron chunks para el documento ${documentId}`,
        );
      }

      const chunks = chunksResult.chunks;
      this.logger.log(`Se encontraron ${chunks.length} chunks para procesar`);

      // 3. Generar el índice con ejercicios usando el LLM
      const documentIndex = await this.indexGenerator.generateDocumentIndex(
        documentId,
        document.documentTitle || document.originalName,
        chunks,
        config,
      );

      this.logger.log(
        `Índice generado exitosamente con ${documentIndex.chapters.length} capítulos`,
      );

      // Log detallado del contenido generado
      let totalExercises = 0;
      documentIndex.chapters.forEach((chapter, chapterIndex) => {
        const chapterExercises = chapter.exercises.length;
        const subtopicExercises = chapter.subtopics.reduce(
          (sum, subtopic) => sum + subtopic.exercises.length,
          0,
        );
        const totalChapterExercises = chapterExercises + subtopicExercises;
        totalExercises += totalChapterExercises;

        this.logger.log(
          `Capítulo ${chapterIndex + 1}: "${chapter.title}" - ${totalChapterExercises} ejercicios`,
        );
      });

      this.logger.log(`Total de ejercicios generados: ${totalExercises}`);

      // 4. Persistir el índice en la base de datos
      this.logger.log('Guardando índice en la base de datos...');
      const savedIndex = await this.documentIndexRepository.save(documentIndex);
      this.logger.log(`Índice guardado exitosamente con ID: ${savedIndex.id}`);

      return savedIndex;
    } catch (error) {
      this.logger.error(
        `Error generando índice para documento ${documentId}:`,
        error,
      );
      throw new Error(
        `Error generando índice: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
