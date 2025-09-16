import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  DocumentIndexGeneratorPort,
  IndexGenerationConfig,
} from '../../domain/ports/document-index-generator.port';
import {
  DocumentIndex,
  IndexChapter,
  IndexSubtopic,
  Exercise,
  ExerciseType,
  ExerciseDifficulty,
  IndexStatus,
} from '../../domain/entities/document-index.entity';
import { DocumentChunk } from '../../domain/entities/document-chunk.entity';

@Injectable()
export class GeminiIndexGeneratorAdapter implements DocumentIndexGeneratorPort {
  private readonly genAI: GoogleGenerativeAI;
  private readonly defaultConfig: IndexGenerationConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
    language: 'es',
    detailLevel: 'intermediate',
    exerciseTypes: [
      'CONCEPTUAL',
      'PRACTICAL',
      'ANALYSIS',
      'APPLICATION',
      'PROBLEM_SOLVING',
    ],
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateDocumentIndex(
    documentId: string,
    documentTitle: string,
    chunks: DocumentChunk[],
    config?: Partial<IndexGenerationConfig>,
  ): Promise<DocumentIndex> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };

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
            finalConfig,
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
    batch: DocumentChunk[],
    documentTitle: string,
    batchNumber: number,
    totalBatches: number,
    config: IndexGenerationConfig,
  ): Promise<IndexChapter[]> {
    const model = this.genAI.getGenerativeModel({
      model: config.model!,
      generationConfig: {
        temperature: config.temperature,
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
      config,
    );

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parsear la respuesta JSON del lote
    const batchData = this.parseGeminiResponse(text);

    return (
      batchData.chapters?.map((chapter: any) => this.mapChapter(chapter)) || []
    );
  }

  /**
   * Genera capítulos básicos para un lote cuando falla la AI
   */
  private generateFallbackChaptersForBatch(
    batch: DocumentChunk[],
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

      // Crear subtemas básicos con ejercicios
      const subtopics: IndexSubtopic[] = chapterChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');

          // Crear ejercicio básico para el subtema
          const exercise = new Exercise(
            ExerciseType.CONCEPTUAL,
            `Analizar: ${firstWords || 'Contenido'}`,
            `Explica los conceptos principales presentados en esta sección.`,
            ExerciseDifficulty.INTERMEDIATE,
            '15 minutos',
            words.slice(0, 2),
          );

          return new IndexSubtopic(
            `${batchNumber}.${chapterNumber}.${idx + 1} ${firstWords || 'Contenido'}`,
            'Sección generada automáticamente',
            [exercise],
          );
        });

      // Crear ejercicio para el capítulo
      const chapterExercise = new Exercise(
        ExerciseType.ANALYSIS,
        `Análisis del Lote ${batchNumber} - Sección ${chapterNumber}`,
        `Realiza un análisis comprensivo de los temas tratados en esta sección.`,
        ExerciseDifficulty.INTERMEDIATE,
        '30 minutos',
        words,
      );

      chapters.push(
        new IndexChapter(
          chapterTitle,
          'Capítulo generado automáticamente',
          subtopics,
          [chapterExercise],
        ),
      );
    }

    return chapters;
  }

  /**
   * Genera un índice básico cuando AI no está disponible
   */
  private generateFallbackIndex(
    documentId: string,
    documentTitle: string,
    chunks: DocumentChunk[],
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

      // Crear subtemas básicos con ejercicios
      const subtopics: IndexSubtopic[] = groupChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');

          // Crear ejercicio básico
          const exercise = new Exercise(
            ExerciseType.CONCEPTUAL,
            `Revisar: ${firstWords || 'Contenido'}`,
            `Revisa y explica los conceptos clave de esta sección.`,
            ExerciseDifficulty.BASIC,
            '10 minutos',
            words.slice(0, 2),
          );

          return new IndexSubtopic(
            `${i + 1}.${idx + 1} ${firstWords || 'Contenido'}`,
            'Subtema generado automáticamente',
            [exercise],
          );
        });

      // Crear ejercicio para el capítulo
      const chapterExercise = new Exercise(
        ExerciseType.APPLICATION,
        `Aplicación práctica - ${chapterTitle}`,
        `Aplica los conceptos aprendidos en esta sección a un caso práctico.`,
        ExerciseDifficulty.INTERMEDIATE,
        '25 minutos',
        words,
      );

      chapters.push(
        new IndexChapter(
          chapterTitle,
          'Capítulo generado automáticamente',
          subtopics,
          [chapterExercise],
        ),
      );
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
    config: IndexGenerationConfig,
  ): string {
    return `
Eres un experto en análisis de documentos académicos y generación de contenido educativo.

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
6. Crea ejercicios educativos específicos para cada tema
7. Los ejercicios NO deben ser de opción múltiple
8. Incluye diferentes tipos: CONCEPTUAL, PRACTICAL, ANALYSIS, APPLICATION, PROBLEM_SOLVING
9. Asigna dificultad: BASIC, INTERMEDIATE, ADVANCED

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
          "description": "Descripción del subtema",
          "exercises": [
            {
              "type": "CONCEPTUAL|PRACTICAL|ANALYSIS|APPLICATION|PROBLEM_SOLVING",
              "title": "Título del ejercicio",
              "description": "Descripción detallada del ejercicio",
              "difficulty": "BASIC|INTERMEDIATE|ADVANCED",
              "estimatedTime": "15 minutos",
              "keywords": ["palabra1", "palabra2"]
            }
          ]
        }
      ],
      "exercises": [
        {
          "type": "CONCEPTUAL|PRACTICAL|ANALYSIS|APPLICATION|PROBLEM_SOLVING",
          "title": "Título del ejercicio del capítulo",
          "description": "Descripción detallada",
          "difficulty": "BASIC|INTERMEDIATE|ADVANCED",
          "estimatedTime": "30 minutos",
          "keywords": ["palabra1", "palabra2"]
        }
      ]
    }
  ]
}
`;
  }

  private buildPrompt(
    documentTitle: string,
    fullText: string,
    config: IndexGenerationConfig,
  ): string {
    return `
Eres un experto en análisis de documentos académicos y generación de contenido educativo. 

TAREA: Analiza el siguiente documento y genera un índice estructurado con ejercicios educativos.

DOCUMENTO: "${documentTitle}"

CONTENIDO:
${fullText}

INSTRUCCIONES:
1. Analiza todo el contenido del documento
2. Identifica los temas principales y subtemas
3. Para cada tema, crea ejercicios educativos relevantes
4. Los ejercicios NO deben ser de opción múltiple
5. Incluye diferentes tipos: conceptuales, prácticos, de análisis, aplicación, resolución de problemas
6. Asigna dificultad: BASIC, INTERMEDIATE, ADVANCED
7. Estima tiempo de resolución cuando sea apropiado

FORMATO DE RESPUESTA (JSON estricto):
{
  "title": "Título del documento",
  "chapters": [
    {
      "title": "Nombre del capítulo",
      "description": "Descripción breve del capítulo",
      "subtopics": [
        {
          "title": "Nombre del subtema",
          "description": "Descripción del subtema",
          "exercises": [
            {
              "type": "CONCEPTUAL|PRACTICAL|ANALYSIS|APPLICATION|PROBLEM_SOLVING",
              "title": "Título del ejercicio",
              "description": "Descripción detallada del ejercicio o problema a resolver",
              "difficulty": "BASIC|INTERMEDIATE|ADVANCED",
              "estimatedTime": "15 minutos",
              "keywords": ["palabra1", "palabra2"]
            }
          ]
        }
      ],
      "exercises": [
        {
          "type": "CONCEPTUAL|PRACTICAL|ANALYSIS|APPLICATION|PROBLEM_SOLVING",
          "title": "Título del ejercicio",
          "description": "Descripción detallada del ejercicio",
          "difficulty": "BASIC|INTERMEDIATE|ADVANCED",
          "estimatedTime": "30 minutos",
          "keywords": ["palabra1", "palabra2"]
        }
      ]
    }
  ]
}

IMPORTANTE: 
- Responde ÚNICAMENTE con el JSON válido
- No incluyas texto adicional antes o después del JSON
- Asegúrate de que el JSON sea válido y parseable
- Incluye al menos 2-3 ejercicios por tema principal
- Los ejercicios deben ser específicos y aplicables al contenido
`;
  }

  private parseGeminiResponse(response: string): any {
    try {
      // Limpiar la respuesta de posibles caracteres extra
      let cleanResponse = response.trim();

      // Remover markdown code blocks si existen
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '');
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.replace(/\s*```$/, '');
      }

      // Remover otros tipos de markdown
      cleanResponse = cleanResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');

      // Buscar el JSON en la respuesta
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);

      // Intentar corregir errores comunes de JSON
      cleanResponse = this.fixCommonJsonErrors(cleanResponse);

      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parseando respuesta de Gemini:', error);
      console.error('Respuesta recibida:', response.substring(0, 1000) + '...');
      throw new Error('La respuesta de Gemini no es un JSON válido');
    }
  }

  /**
   * Corrige errores comunes en el JSON generado por Gemini
   */
  private fixCommonJsonErrors(jsonString: string): string {
    let fixed = jsonString;

    // Corregir comas faltantes entre objetos del array
    fixed = fixed.replace(/}\s*\n\s*{/g, '},\n  {');

    // Corregir arrays mal formateados
    fixed = fixed.replace(/]\s*,\s*{/g, '],\n  {');

    // Asegurar que los arrays estén bien cerrados
    fixed = fixed.replace(/}\s*\n\s*]/g, '}\n  ]');

    // Corregir propiedades sin comillas
    fixed = fixed.replace(/(\w+):/g, '"$1":');

    // Corregir comillas simples por dobles
    fixed = fixed.replace(/'/g, '"');

    return fixed;
  }

  private mapChapter(chapterData: any): IndexChapter {
    const subtopics = (chapterData.subtopics || []).map((subtopic: any) =>
      this.mapSubtopic(subtopic),
    );

    const exercises = (chapterData.exercises || []).map((exercise: any) =>
      this.mapExercise(exercise),
    );

    return new IndexChapter(
      chapterData.title,
      chapterData.description,
      subtopics,
      exercises,
    );
  }

  private mapSubtopic(subtopicData: any): IndexSubtopic {
    const exercises = (subtopicData.exercises || []).map((exercise: any) =>
      this.mapExercise(exercise),
    );

    return new IndexSubtopic(
      subtopicData.title,
      subtopicData.description,
      exercises,
    );
  }

  private mapExercise(exerciseData: any): Exercise {
    return new Exercise(
      this.mapExerciseType(exerciseData.type),
      exerciseData.title,
      exerciseData.description,
      this.mapExerciseDifficulty(exerciseData.difficulty),
      exerciseData.estimatedTime,
      exerciseData.keywords || [],
    );
  }

  private mapExerciseType(type: string): ExerciseType {
    switch (type?.toUpperCase()) {
      case 'CONCEPTUAL':
        return ExerciseType.CONCEPTUAL;
      case 'PRACTICAL':
        return ExerciseType.PRACTICAL;
      case 'ANALYSIS':
        return ExerciseType.ANALYSIS;
      case 'SYNTHESIS':
        return ExerciseType.SYNTHESIS;
      case 'APPLICATION':
        return ExerciseType.APPLICATION;
      case 'PROBLEM_SOLVING':
        return ExerciseType.PROBLEM_SOLVING;
      default:
        return ExerciseType.CONCEPTUAL;
    }
  }

  private mapExerciseDifficulty(difficulty: string): ExerciseDifficulty {
    switch (difficulty?.toUpperCase()) {
      case 'BASIC':
        return ExerciseDifficulty.BASIC;
      case 'INTERMEDIATE':
        return ExerciseDifficulty.INTERMEDIATE;
      case 'ADVANCED':
        return ExerciseDifficulty.ADVANCED;
      default:
        return ExerciseDifficulty.INTERMEDIATE;
    }
  }

  private generateId(): string {
    return `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
