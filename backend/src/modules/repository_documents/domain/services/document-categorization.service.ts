import { Injectable, Logger } from '@nestjs/common';
import { DocumentCategory } from '../entities/document-category.entity';
import type { DocumentCategoryRepositoryPort } from '../ports/document-category-repository.port';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';

/**
 * Opciones para la categorización de documentos
 */
export interface DocumentCategorizationOptions {
  /** Si debe reemplazar categorías existentes */
  replaceExisting?: boolean;

  /** Umbral de confianza mínimo (0-1) */
  confidenceThreshold?: number;

  /** Máximo número de categorías por documento */
  maxCategoriesPerDocument?: number;
}

/**
 * Resultado de la categorización de un documento
 */
export interface DocumentCategorizationResult {
  /** ID del documento categorizado */
  documentId: string;

  /** Categorías asignadas */
  assignedCategories: Array<{
    category: DocumentCategory;
    confidence: number;
    reason: string;
  }>;

  /** Tiempo de procesamiento en ms */
  processingTimeMs: number;

  /** Si hubo errores */
  errors?: string[];
}

/**
 * Servicio de dominio para categorización de documentos
 *
 * Utiliza un sistema de categorización basado en palabras clave y patrones
 * para clasificar automáticamente los documentos
 */
@Injectable()
export class DocumentCategorizationService {
  private readonly logger = new Logger(DocumentCategorizationService.name);

  constructor(
    private readonly categoryRepository: DocumentCategoryRepositoryPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Categoriza un documento basándose en su contenido
   */
  async categorizeDocument(
    documentId: string,
    options: DocumentCategorizationOptions = {},
  ): Promise<DocumentCategorizationResult> {
    const startTime = Date.now();
    this.logger.log(
      `🔍 [Service] Iniciando categorización del documento: ${documentId}`,
    );
    this.logger.log(`🔧 [Service] Opciones: ${JSON.stringify(options)}`);

    try {
      // 1. Obtener chunks del documento
      this.logger.log(`📋 [Service] Obteniendo chunks del documento...`);
      const chunksResult =
        await this.chunkRepository.findByDocumentId(documentId);

      this.logger.log(
        `📊 [Service] Chunks encontrados: ${chunksResult.chunks.length}`,
      );

      if (chunksResult.chunks.length === 0) {
        this.logger.error(
          `❌ [Service] No se encontraron chunks para el documento ${documentId}`,
        );
        throw new Error(
          `No se encontraron chunks para el documento ${documentId}`,
        );
      }

      // 2. Analizar contenido para determinar categorías
      this.logger.log(
        `🔍 [Service] Analizando contenido para categorización...`,
      );
      const documentContent = chunksResult.chunks
        .map((chunk) => chunk.content)
        .join(' ');

      this.logger.log(
        `📝 [Service] Contenido total: ${documentContent.length} caracteres`,
      );

      const categoryScores = await this.analyzeContent(documentContent);
      this.logger.log(
        `🎯 [Service] Categorías analizadas: ${categoryScores.length}`,
      );

      // 3. Filtrar por umbral de confianza
      const confidenceThreshold = options.confidenceThreshold || 0.3;
      const maxCategories = options.maxCategoriesPerDocument || 3;

      this.logger.log(
        `⚡ [Service] Aplicando filtros - Umbral: ${confidenceThreshold}, Máx: ${maxCategories}`,
      );

      const qualifiedCategories = categoryScores
        .filter((score) => score.confidence >= confidenceThreshold)
        .slice(0, maxCategories);

      this.logger.log(
        `✅ [Service] Categorías calificadas: ${qualifiedCategories.length}`,
      );

      // 4. Si no hay categorías calificadas, asignar "General"
      if (qualifiedCategories.length === 0) {
        this.logger.warn(
          `⚠️ [Service] No hay categorías calificadas, asignando "General"`,
        );
        const generalCategory =
          await this.categoryRepository.findCategoryByName('General');
        if (generalCategory) {
          qualifiedCategories.push({
            category: generalCategory,
            confidence: 0.5,
            reason:
              'Categoría por defecto - no se encontraron patrones específicos',
          });
        }
      }

      // 5. Asignar categorías al documento
      this.logger.log(`💾 [Service] Iniciando asignación de categorías...`);
      const assignedCategories: Array<{
        category: DocumentCategory;
        confidence: number;
        reason: string;
      }> = [];

      // Si debe reemplazar categorías existentes, limpiar primero
      if (options.replaceExisting) {
        this.logger.log(`🧹 [Service] Limpiando categorías existentes...`);
        const existingMappings =
          await this.categoryRepository.findMappingsByDocumentId(documentId);
        this.logger.log(
          `🗑️ [Service] Mappings existentes a remover: ${existingMappings.length}`,
        );
        for (const mapping of existingMappings) {
          await this.categoryRepository.removeCategoryFromDocument(
            documentId,
            mapping.categoryId,
          );
        }
      }

      // Asignar nuevas categorías
      this.logger.log(
        `📌 [Service] Asignando ${qualifiedCategories.length} nuevas categorías...`,
      );
      for (const categoryScore of qualifiedCategories) {
        try {
          // Verificar si ya tiene esta categoría
          const hasCategory = await this.categoryRepository.hasCategory(
            documentId,
            categoryScore.category.id,
          );

          if (!hasCategory) {
            await this.categoryRepository.assignCategoryToDocument(
              documentId,
              categoryScore.category.id,
            );

            assignedCategories.push(categoryScore);
            this.logger.log(
              `✅ Categoría asignada: ${categoryScore.category.name} (${(categoryScore.confidence * 100).toFixed(1)}%)`,
            );
          } else if (!options.replaceExisting) {
            this.logger.debug(
              `⏭️ Documento ya tiene la categoría: ${categoryScore.category.name}`,
            );
            assignedCategories.push(categoryScore);
          }
        } catch (error) {
          this.logger.error(
            `❌ Error asignando categoría ${categoryScore.category.name}:`,
            error,
          );
        }
      }

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Categorización completada para ${documentId} en ${processingTime}ms. ` +
          `Categorías asignadas: ${assignedCategories.length}`,
      );

      return {
        documentId,
        assignedCategories,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(
        `❌ Error categorizando documento ${documentId}:`,
        errorMessage,
      );

      return {
        documentId,
        assignedCategories: [],
        processingTimeMs: processingTime,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async getAvailableCategories(): Promise<DocumentCategory[]> {
    return this.categoryRepository.findAllCategories();
  }

  /**
   * Obtiene las categorías de un documento específico
   */
  async getDocumentCategories(documentId: string): Promise<DocumentCategory[]> {
    return this.categoryRepository.findCategoriesByDocumentId(documentId);
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Analiza el contenido del documento y asigna puntuaciones a las categorías
   */
  private async analyzeContent(content: string): Promise<
    Array<{
      category: DocumentCategory;
      confidence: number;
      reason: string;
    }>
  > {
    const contentLower = content.toLowerCase();
    const scores: Array<{
      category: DocumentCategory;
      confidence: number;
      reason: string;
    }> = [];

    // Obtener todas las categorías disponibles de la base de datos
    const categories = await this.categoryRepository.findAllCategories();

    for (const category of categories) {
      try {
        let score = 0;
        const matchedKeywords: string[] = [];

        // Generar palabras clave basadas en el nombre y descripción de la categoría
        const keywords = this.generateKeywordsForCategory(category);

        // Verificar palabras clave
        for (const keyword of keywords) {
          if (contentLower.includes(keyword.toLowerCase())) {
            score += 0.1;
            matchedKeywords.push(keyword);
          }
        }

        // Bonus si el nombre de la categoría aparece directamente
        if (contentLower.includes(category.name.toLowerCase())) {
          score += 0.3;
          matchedKeywords.push(category.name);
        }

        // Normalizar puntuación (máximo 1.0)
        const confidence = Math.min(score, 1.0);

        if (confidence > 0) {
          const reason = this.buildReason(matchedKeywords, []);
          scores.push({
            category,
            confidence,
            reason,
          });
        }
      } catch (error) {
        this.logger.error(
          `Error analizando categoría ${category.name}:`,
          error,
        );
      }
    }

    // Ordenar por confianza descendente
    return scores.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Genera palabras clave para una categoría basándose en su nombre y descripción
   */
  private generateKeywordsForCategory(category: DocumentCategory): string[] {
    const keywords: string[] = [];

    // Palabras del nombre de la categoría
    const nameWords = category.name.toLowerCase().split(/\s+/);
    keywords.push(...nameWords);

    // Palabras clave específicas por categoría
    const categoryKeywords: { [key: string]: string[] } = {
      matemáticas: [
        'algebra',
        'cálculo',
        'geometría',
        'estadística',
        'número',
        'ecuación',
        'función',
        'variable',
        'integral',
        'derivada',
      ],
      programación: [
        'código',
        'algoritmo',
        'software',
        'desarrollo',
        'java',
        'python',
        'javascript',
        'clase',
        'función',
        'método',
        'variable',
      ],
      historia: [
        'histórico',
        'evento',
        'fecha',
        'siglo',
        'época',
        'guerra',
        'revolución',
        'imperio',
        'reino',
        'civilización',
      ],
      ciencias: [
        'científico',
        'investigación',
        'experimento',
        'hipótesis',
        'teoría',
        'física',
        'química',
        'biología',
        'laboratorio',
      ],
      literatura: [
        'novela',
        'poesía',
        'ensayo',
        'autor',
        'obra',
        'narrativa',
        'personaje',
        'análisis literario',
        'crítica',
      ],
      medicina: [
        'médico',
        'salud',
        'enfermedad',
        'tratamiento',
        'síntoma',
        'diagnóstico',
        'paciente',
        'anatomía',
        'farmacología',
      ],
      economía: [
        'económico',
        'mercado',
        'precio',
        'demanda',
        'oferta',
        'inflación',
        'inversión',
        'financiero',
        'comercio',
      ],
      derecho: [
        'legal',
        'ley',
        'jurídico',
        'contrato',
        'tribunal',
        'juicio',
        'código',
        'norma',
        'reglamento',
      ],
      educación: [
        'educativo',
        'enseñanza',
        'aprendizaje',
        'estudiante',
        'profesor',
        'pedagogía',
        'didáctica',
        'currículo',
      ],
      general: [
        'documento',
        'texto',
        'información',
        'contenido',
        'material',
        'archivo',
      ],
    };

    const categoryName = category.name.toLowerCase();
    if (categoryKeywords[categoryName]) {
      keywords.push(...categoryKeywords[categoryName]);
    }

    // Palabras de la descripción (filtrar palabras comunes)
    const commonWords = [
      'de',
      'la',
      'el',
      'en',
      'y',
      'a',
      'que',
      'con',
      'para',
      'sobre',
      'documentos',
      'relacionados',
    ];
    
    if (category.description) {
      const descriptionWords = category.description
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !commonWords.includes(word));

      keywords.push(...descriptionWords);
    }

    return [...new Set(keywords)]; // Eliminar duplicados
  }

  /**
   * Construye una explicación de por qué se asignó una categoría
   */
  private buildReason(keywords: string[], patterns: string[]): string {
    const reasons: string[] = [];

    if (keywords.length > 0) {
      reasons.push(
        `Palabras clave encontradas: ${keywords.slice(0, 3).join(', ')}`,
      );
    }

    if (patterns.length > 0) {
      reasons.push(`Patrones detectados: ${patterns.length}`);
    }

    return reasons.join('. ') || 'Coincidencias generales detectadas';
  }
}
