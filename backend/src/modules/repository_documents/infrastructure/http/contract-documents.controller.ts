import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { GetDocumentsBySubjectUseCase } from '../../application/queries/get-documents-by-subject.usecase';
import { GetDocumentContentUseCase } from '../../application/queries/get-document-content.usecase';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import {
  DOCUMENT_REPOSITORY_PORT,
  DOCUMENT_CHUNK_REPOSITORY_PORT,
} from '../../tokens';
import {
  ContractDocumentListResponseDto,
  ContractDocumentItemDto,
  DocumentContentResponseDto,
  DocumentContentMetadataDto,
  GetDocumentsBySubjectQueryDto,
} from './dtos/contract-documents.dto';
import {
  DocumentIndex,
  IndexChapter,
  IndexSubtopic,
  IndexStatus,
} from '../../domain/entities/document-index.entity';

/**
 * Controlador para endpoints del contrato con el módulo de estudiantes
 * Base URL: /api/v1/documentos
 */
@Controller('api/v1/documents')
@UseGuards(AuthGuard('jwt'))
export class ContractDocumentsController {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly getDocumentsBySubjectUseCase: GetDocumentsBySubjectUseCase,
    private readonly getDocumentContentUseCase: GetDocumentContentUseCase,
    @Inject(DOCUMENT_REPOSITORY_PORT)
    private readonly documentRepository: DocumentRepositoryPort,
    @Inject(DOCUMENT_CHUNK_REPOSITORY_PORT)
    private readonly chunkRepository: DocumentChunkRepositoryPort,
    private readonly configService: ConfigService,
    private readonly logger: ContextualLoggerService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  @Get('subject/:subjectId/documents')
  async getDocumentsBySubject(
    @Param('subjectId') subjectId: string,
    @Query() query: GetDocumentsBySubjectQueryDto,
  ): Promise<ContractDocumentListResponseDto> {
    try {
      this.logger.logDocumentOperation('list', undefined, {
        subjectId,
        query,
      });

      if (!subjectId || !subjectId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ID de materia es requerido',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.getDocumentsBySubjectUseCase.execute({
        subjectId: subjectId.trim(),
        tipo: query.tipo,
        page: query.page || 1,
        limit: query.limit || 10,
      });

      // Mapear la respuesta del dominio a DTOs del contrato
      const documentos = result.docs.map(
        (doc) =>
          new ContractDocumentItemDto(
            doc.id,
            doc.originalName, // titulo
            this.extractFileType(doc.mimeType), // tipo
            doc.downloadUrl, // url
            doc.uploadedAt, // fechaCarga
            doc.uploadedBy, // profesorId
          ),
      );

      this.logger.log('Documents retrieved successfully for subject', {
        subjectId,
        totalDocuments: result.total,
        documentsReturned: documentos.length,
        page: result.page,
      });

      return new ContractDocumentListResponseDto(
        documentos,
        result.total,
        result.page,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving documents by subject',
        error instanceof Error ? error : errorMessage,
        {
          subjectId,
          errorType: 'DOCUMENTS_BY_SUBJECT_ERROR',
        },
      );

      // Manejar diferentes tipos de errores
      if (errorMessage.includes('no encontrado')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Materia no encontrada',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('Servicio de almacenamiento')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Servicio de almacenamiento no disponible',
            error: 'Service Unavailable',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Error genérico
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al obtener documentos',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /documentos/{docId}/contenido
   * Obtiene el índice generado de un documento específico.
   */
  @Get(':docId/content')
  async getDocumentContent(
    @Param('docId') docId: string,
  ): Promise<DocumentContentResponseDto> {
    try {
      this.logger.logDocumentOperation('download', docId);

      if (!docId || !docId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ID de documento es requerido',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 1. Removed basicResult as it's no longer needed

      // 2. Verificar que el documento existe
      const document = await this.documentRepository.findById(docId.trim());
      if (!document) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Documento no encontrado',
            error: 'Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // 3. Obtener todos los chunks del documento (sin límite)
      const chunksResult = await this.chunkRepository.findByDocumentId(
        docId.trim(),
        { limit: 10000 }, // Límite alto para documentos grandes
      );
      if (
        !chunksResult ||
        !chunksResult.chunks ||
        chunksResult.chunks.length === 0
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'No se encontraron chunks para el documento',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const chunks = chunksResult.chunks;
      this.logger.log(`Se encontraron ${chunks.length} chunks para procesar`);

      // 4. Generar el índice usando Gemini
      const documentIndex = await this.generateDocumentIndex(
        docId.trim(),
        document.documentTitle || document.originalName,
        chunks,
      );

      // 5. Formatear el índice como string numerado
      const formattedIndex = this.formatIndexAsString(documentIndex);

      // 6. Generar resumen a partir de los chunks
      const summary = this.generateSummaryFromChunks(chunks);

      // 7. Obtener número de páginas del documento
      const pageCount = document.pageCount || Math.ceil(chunks.length / 2) || 1;

      this.logger.log('Document index generated successfully', {
        docId,
        indexLength: formattedIndex.length,
        chaptersCount: documentIndex.chapters.length,
        pageCount,
        summaryLength: summary.length,
      });

      return new DocumentContentResponseDto(
        formattedIndex,
        new DocumentContentMetadataDto(pageCount, summary),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error generating document index',
        error instanceof Error ? error : errorMessage,
        {
          docId,
          errorType: 'DOCUMENT_INDEX_ERROR',
        },
      );

      // Manejar diferentes tipos de errores
      if (errorMessage.includes('no encontrado')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Documento no encontrado',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('chunks')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'El documento no tiene contenido procesado',
            error: 'Bad Request',
            details: errorMessage,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Error genérico
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al generar índice',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Genera el índice del documento usando Gemini AI con fallback
   */
  private async generateDocumentIndex(
    documentId: string,
    documentTitle: string,
    chunks: any[],
  ): Promise<DocumentIndex> {
    try {
      console.log(`Generando índice para documento: ${documentTitle}`);
      console.log(`Procesando todos los ${chunks.length} chunks en lotes`);

      // Procesar todos los chunks en lotes pequeños
      const batchSize = 50; // Tamaño de lote para evitar límites de tokens
      const allChapters: IndexChapter[] = [];

      // Ordenar chunks por índice
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      // Procesar en lotes
      for (let i = 0; i < sortedChunks.length; i += batchSize) {
        const batch = sortedChunks.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(sortedChunks.length / batchSize);

        console.log(
          `Procesando lote ${batchNumber}/${totalBatches} (${batch.length} chunks)`,
        );

        try {
          const batchChapters = await this.processBatch(
            batch,
            documentTitle,
            batchNumber,
            totalBatches,
          );

          allChapters.push(...batchChapters);

          // Pequeña pausa entre lotes para evitar rate limits
          if (i + batchSize < sortedChunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          console.warn(
            `Error en lote ${batchNumber}, usando fallback:`,
            batchError,
          );

          // Generar capítulos básicos para este lote
          const fallbackChapters = this.generateFallbackChaptersForBatch(
            batch,
            batchNumber,
          );
          allChapters.push(...fallbackChapters);
        }
      }

      // Crear el índice final
      const documentIndex = new DocumentIndex(
        this.generateId(),
        documentId,
        documentTitle,
        allChapters,
        new Date(),
        IndexStatus.GENERATED,
      );

      console.log(
        `Índice generado con ${documentIndex.chapters.length} capítulos de ${chunks.length} chunks`,
      );

      return documentIndex;
    } catch (error) {
      console.error('Error generando índice con Gemini:', error);

      // Fallback: generar índice básico sin AI
      return this.generateFallbackIndex(documentId, documentTitle, chunks);
    }
  }

  /**
   * Procesa un lote de chunks con Gemini AI
   */
  private async processBatch(
    batch: any[],
    documentTitle: string,
    batchNumber: number,
    totalBatches: number,
  ): Promise<IndexChapter[]> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Reducido para lotes más pequeños
      },
    });

    // Combinar chunks del lote en texto
    const batchText = batch.map((chunk) => chunk.content).join('\n\n');

    const prompt = this.buildBatchPrompt(
      documentTitle,
      batchText,
      batchNumber,
      totalBatches,
    );

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parsear la respuesta JSON del lote
    const batchData: any = this.parseGeminiResponse(text);

    return (
      batchData.chapters?.map((chapter: any) => this.mapChapter(chapter)) || []
    );
  }

  /**
   * Genera capítulos básicos para un lote cuando falla la AI
   */
  private generateFallbackChaptersForBatch(
    batch: any[],
    batchNumber: number,
  ): IndexChapter[] {
    const chapters: IndexChapter[] = [];
    const chunksPerChapter = 10;

    for (let i = 0; i < batch.length; i += chunksPerChapter) {
      const chapterChunks = batch.slice(i, i + chunksPerChapter);
      const chapterNumber = Math.floor(i / chunksPerChapter) + 1;

      // Extraer palabras clave del primer chunk
      const firstChunkContent: string = chapterChunks[0]?.content || '';
      const words: string[] = firstChunkContent
        .split(' ')
        .filter((w) => w.length > 5)
        .slice(0, 3);

      const chapterTitle: string =
        words.length > 0
          ? `Lote ${batchNumber} - Sección ${chapterNumber}: ${words.join(', ')}`
          : `Lote ${batchNumber} - Sección ${chapterNumber}`;

      // Crear subtemas básicos
      const subtopics: IndexSubtopic[] = chapterChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');
          return new IndexSubtopic(
            `${batchNumber}.${chapterNumber}.${idx + 1} ${firstWords || 'Contenido'}`,
            '',
            [],
          );
        });

      chapters.push(new IndexChapter(chapterTitle, '', subtopics, []));
    }

    return chapters;
  }

  /**
   * Genera un índice básico cuando AI no está disponible
   */
  private generateFallbackIndex(
    documentId: string,
    documentTitle: string,
    chunks: any[],
  ): DocumentIndex {
    console.log('Generando índice de fallback sin AI');

    // Crear capítulos básicos basados en el contenido
    const chapters: IndexChapter[] = [];
    const chunkGroups = Math.ceil(chunks.length / 10); // Agrupar cada 10 chunks

    for (let i = 0; i < chunkGroups; i++) {
      const startChunk = i * 10;
      const endChunk = Math.min((i + 1) * 10, chunks.length);
      const groupChunks = chunks.slice(startChunk, endChunk);

      // Extraer palabras clave del primer chunk del grupo
      const firstChunkContent: string = groupChunks[0]?.content || '';
      const words: string[] = firstChunkContent
        .split(' ')
        .filter((w) => w.length > 5)
        .slice(0, 3);
      const chapterTitle: string =
        words.length > 0
          ? `Sección ${i + 1}: ${words.join(', ')}`
          : `Sección ${i + 1}`;

      // Crear subtemas básicos
      const subtopics: IndexSubtopic[] = groupChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');
          return new IndexSubtopic(
            `${i + 1}.${idx + 1} ${firstWords || 'Contenido'}`,
            '',
            [],
          );
        });

      chapters.push(new IndexChapter(chapterTitle, '', subtopics, []));
    }

    return new DocumentIndex(
      this.generateId(),
      documentId,
      documentTitle,
      chapters,
      new Date(),
      IndexStatus.GENERATED,
    );
  }

  /**
   * Construye el prompt para un lote específico
   */
  private buildBatchPrompt(
    documentTitle: string,
    batchText: string,
    batchNumber: number,
    totalBatches: number,
  ): string {
    return `
Eres un experto en análisis de documentos académicos. Analiza esta parte del documento y genera capítulos e índices detallados.

DOCUMENTO: "${documentTitle}"
LOTE: ${batchNumber} de ${totalBatches}

CONTENIDO DEL LOTE:
${batchText}

INSTRUCCIONES:
1. Analiza SOLO el contenido de este lote
2. Genera capítulos y subtemas basados en el contenido real
3. Los títulos deben ser descriptivos y específicos del contenido
4. Incluye entre 2-5 capítulos por lote dependiendo del contenido
5. Cada capítulo debe tener 2-4 subtemas relevantes

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "title": "Título descriptivo del lote",
  "chapters": [
    {
      "title": "Título del capítulo basado en contenido real",
      "description": "Breve descripción",
      "subtopics": [
        {
          "title": "Subtema específico del contenido",
          "description": "Descripción del subtema"
        }
      ]
    }
  ]
}
`;
  }

  /**
   * Construye el prompt para Gemini (método original mantenido para compatibilidad)
   */
  private buildPrompt(documentTitle: string, fullText: string): string {
    return `
Eres un experto en análisis de documentos académicos. Analiza el siguiente documento completo y genera un índice detallado.

DOCUMENTO: "${documentTitle}"

CONTENIDO COMPLETO:
${fullText}

INSTRUCCIONES CRÍTICAS:
1. Lee y analiza TODO el contenido proporcionado
2. Identifica las secciones principales del documento
3. Para cada sección, identifica los subtemas específicos mencionados
4. USA los títulos y conceptos REALES del documento, NO generes nombres genéricos
5. Si encuentras secciones como "Introduction", "Related Work", "Methodology", etc., úsalas
6. Los subtemas deben ser conceptos específicos mencionados en cada sección

RESPONDE SOLO EN JSON:
{
  "title": "${documentTitle}",
  "chapters": [
    {
      "title": "Título real de la sección",
      "subtopics": [
        {
          "title": "Concepto específico mencionado"
        }
      ]
    }
  ]
}

IMPORTANTE: 
- Responde ÚNICAMENTE con el JSON válido
- No incluyas texto adicional antes o después del JSON
- Asegúrate de que el JSON sea válido y parseable
- SOLO títulos de capítulos y subtemas
`;
  }

  /**
   * Parsea la respuesta de Gemini
   */
  private parseGeminiResponse(response: string): any {
    try {
      // Limpiar la respuesta de posibles caracteres extra
      let cleanResponse = response.trim();

      // Buscar el JSON en la respuesta
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);

      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parseando respuesta de Gemini:', error);
      console.error('Respuesta recibida:', response);
      throw new Error('La respuesta de Gemini no es un JSON válido');
    }
  }

  /**
   * Mapea un capítulo desde la respuesta de Gemini
   */
  private mapChapter(chapterData: any): IndexChapter {
    const subtopics = (chapterData.subtopics || []).map((subtopic: any) =>
      this.mapSubtopic(subtopic),
    );

    return new IndexChapter(chapterData.title, '', subtopics, []);
  }

  /**
   * Mapea un subtema desde la respuesta de Gemini
   */
  private mapSubtopic(subtopicData: any): IndexSubtopic {
    return new IndexSubtopic(
      subtopicData.title || 'Contenido específico',
      '',
      [],
    );
  }

  /**
   * Genera un resumen corto basado en los chunks del documento
   */
  private generateSummaryFromChunks(chunks: any[]): string {
    try {
      // Tomar los primeros chunks para el resumen (máximo 3)
      const firstChunks = chunks.slice(0, 3);
      const combinedContent = firstChunks
        .map((chunk) => (chunk.content || chunk.text || '') as string)
        .join(' ')
        .substring(0, 1000); // Limitar a 1000 caracteres

      if (!combinedContent.trim()) {
        return 'Documento técnico especializado';
      }

      // Crear un resumen más completo basado en el contenido
      const sentences = combinedContent
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      const words = combinedContent
        .split(' ')
        .filter((word) => word.length > 4);

      // Intentar crear un resumen con las primeras 2-3 oraciones
      if (sentences.length >= 2) {
        const summary = sentences.slice(0, 2).join('. ').trim();
        if (summary.length > 50 && summary.length < 300) {
          return summary + (summary.endsWith('.') ? '' : '.');
        }
      }

      // Fallback: usar primera oración si es descriptiva
      if (sentences.length >= 1) {
        const firstSentence = sentences[0].trim();
        if (firstSentence.length > 30 && firstSentence.length < 200) {
          return firstSentence + (firstSentence.endsWith('.') ? '' : '.');
        }
      }

      // Último fallback con palabras clave
      const keyWords = words.slice(0, 3).join(', ');
      return `Documento técnico especializado que aborda temas relacionados con ${keyWords || 'metodologías avanzadas'}.`;
    } catch (error) {
      this.logger.warn('Error generating summary from chunks', {
        error: String(error),
      });
      return 'Documento técnico especializado';
    }
  }

  /**
   * Formatea el índice como string numerado (1.1, 1.2, 2.1, etc.)
   */
  private formatIndexAsString(documentIndex: DocumentIndex): string {
    let result = `ÍNDICE DEL DOCUMENTO: ${documentIndex.title}\n\n`;

    documentIndex.chapters.forEach((chapter, chapterIndex) => {
      const chapterNumber = chapterIndex + 1;

      // Título del capítulo
      result += `${chapterNumber}. ${chapter.title}\n\n`;

      // Subtemas del capítulo
      chapter.subtopics.forEach((subtopic, subtopicIndex) => {
        const subtopicNumber = subtopicIndex + 1;
        result += `${chapterNumber}.${subtopicNumber} ${subtopic.title}\n`;
      });

      result += `\n`;
    });

    return result;
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extrae el tipo de archivo del mimeType para cumplir con el contrato
   */
  private extractFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'documento';
    if (mimeType.includes('text')) return 'texto';
    return 'documento';
  }
}
