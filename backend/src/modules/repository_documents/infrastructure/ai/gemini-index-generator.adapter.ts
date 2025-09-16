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
      const model = this.genAI.getGenerativeModel({
        model: finalConfig.model!,
        generationConfig: {
          temperature: finalConfig.temperature,
          maxOutputTokens: finalConfig.maxTokens,
        },
      });

      // Combinar todos los chunks en texto completo
      const fullText = chunks
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map((chunk) => chunk.content)
        .join('\n\n');

      const prompt = this.buildPrompt(documentTitle, fullText, finalConfig);

      console.log(`Generando índice para documento: ${documentTitle}`);
      console.log(`Procesando ${chunks.length} chunks`);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`Respuesta recibida de Gemini`);

      // Parsear la respuesta JSON
      const indexData = this.parseGeminiResponse(text);

      // Crear el índice
      const documentIndex = new DocumentIndex(
        this.generateId(),
        documentId,
        indexData.title || documentTitle,
        indexData.chapters.map((chapter: any) => this.mapChapter(chapter)),
        new Date(),
        IndexStatus.GENERATED,
      );

      console.log(
        `Índice generado con ${documentIndex.chapters.length} capítulos`,
      );

      return documentIndex;
    } catch (error) {
      console.error('Error generando índice con Gemini:', error);
      throw new Error(
        `Error generando índice: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
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
