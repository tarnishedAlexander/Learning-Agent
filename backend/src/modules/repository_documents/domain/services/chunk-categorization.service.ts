import { Injectable } from '@nestjs/common';
import type { DocumentChunk } from '../entities/document-chunk.entity';

/**
 * Resultado de categorización
 */
export interface CategorizationResult {
  categoryId: string;
  confidence: number;
  keywords: string[];
}

/**
 * Servicio de dominio para categorización automática de chunks
 */
@Injectable()
export class ChunkCategorizationService {
  /**
   * Mapeo de categorías con sus palabras clave
   */
  private readonly categoryKeywords: Record<string, string[]> = {
    Programación: [
      'código',
      'función',
      'variable',
      'algoritmo',
      'java',
      'python',
      'javascript',
      'typescript',
      'c++',
      'c#',
      'programar',
      'desarrollo',
      'código fuente',
      'compilar',
      'debugging',
      'sintaxis',
      'loop',
      'if',
      'else',
      'for',
      'while',
      'class',
      'object',
      'method',
      'array',
      'string',
      'integer',
      'boolean',
    ],
    'Bases de Datos': [
      'sql',
      'database',
      'tabla',
      'query',
      'select',
      'insert',
      'update',
      'delete',
      'mysql',
      'postgresql',
      'oracle',
      'mongodb',
      'nosql',
      'primary key',
      'foreign key',
      'índice',
      'join',
      'transaction',
      'acid',
      'normalización',
      'relacional',
      'entidad',
      'atributo',
      'esquema',
      'bd',
      'dbms',
    ],
    'Inteligencia Artificial': [
      'machine learning',
      'deep learning',
      'neural network',
      'ia',
      'ai',
      'algoritmo genético',
      'redes neuronales',
      'aprendizaje automático',
      'minería de datos',
      'big data',
      'tensorflow',
      'pytorch',
      'sklearn',
      'nlp',
      'computer vision',
      'clasificación',
      'regresión',
      'clustering',
      'supervised',
      'unsupervised',
      'reinforcement learning',
    ],
    'Ingeniería de Software': [
      'software engineering',
      'metodología',
      'scrum',
      'agile',
      'waterfall',
      'requirements',
      'design patterns',
      'arquitectura',
      'uml',
      'testing',
      'unit test',
      'integration test',
      'mvc',
      'solid',
      'refactoring',
      'version control',
      'git',
      'continuous integration',
      'devops',
    ],
    'Redes y Sistemas': [
      'red',
      'network',
      'tcp/ip',
      'http',
      'https',
      'dns',
      'dhcp',
      'firewall',
      'router',
      'switch',
      'protocolo',
      'ethernet',
      'wifi',
      'vpn',
      'ssl',
      'seguridad',
      'encriptación',
      'ciberseguridad',
      'sistema operativo',
      'linux',
      'windows',
      'unix',
      'administración de sistemas',
    ],
    Matemáticas: [
      'matemática',
      'álgebra',
      'cálculo',
      'estadística',
      'probabilidad',
      'ecuación',
      'función',
      'derivada',
      'integral',
      'matriz',
      'vector',
      'teorema',
      'demostración',
      'número',
      'infinito',
      'límite',
      'matemática discreta',
      'combinatoria',
      'grafos',
    ],
    Física: [
      'física',
      'mecánica',
      'termodinámica',
      'electromagnetismo',
      'óptica',
      'velocidad',
      'aceleración',
      'fuerza',
      'energía',
      'masa',
      'temperatura',
      'presión',
      'voltaje',
      'corriente',
      'resistencia',
      'campo eléctrico',
      'campo magnético',
      'onda',
      'frecuencia',
      'cuántica',
    ],
    Investigación: [
      'investigación',
      'research',
      'metodología',
      'hipótesis',
      'experimento',
      'análisis',
      'datos',
      'estudio',
      'muestra',
      'variable independiente',
      'variable dependiente',
      'correlación',
      'causalidad',
      'revisión bibliográfica',
      'estado del arte',
      'paper',
      'artículo científico',
      'publicación',
      'peer review',
    ],
    Económica: [
      'economía',
      'finanzas',
      'mercado',
      'demanda',
      'oferta',
      'precio',
      'inflación',
      'pib',
      'gdp',
      'inversión',
      'capital',
      'trabajo',
      'producción',
      'costos',
      'beneficio',
      'utilidad',
      'empresa',
      'negocio',
      'comercial',
      'marketing',
    ],
    Proyectos: [
      'proyecto',
      'project',
      'planificación',
      'cronograma',
      'entregable',
      'milestone',
      'hito',
      'recursos',
      'presupuesto',
      'riesgo',
      'stakeholder',
      'equipo',
      'coordinación',
      'gestión',
      'management',
      'objetivo',
      'meta',
      'alcance',
      'scope',
    ],
    Educación: [
      'educación',
      'enseñanza',
      'aprendizaje',
      'pedagogía',
      'didáctica',
      'estudiante',
      'profesor',
      'docente',
      'clase',
      'curso',
      'materia',
      'asignatura',
      'evaluación',
      'examen',
      'calificación',
      'nota',
      'tarea',
      'homework',
      'universidad',
      'colegio',
    ],
    Literatura: [
      'literatura',
      'novela',
      'poesía',
      'ensayo',
      'drama',
      'teatro',
      'autor',
      'escritor',
      'personaje',
      'narrativa',
      'trama',
      'argumento',
      'estilo',
      'género literario',
      'crítica literaria',
      'análisis textual',
      'interpretación',
      'simbolismo',
      'metáfora',
    ],
    Historia: [
      'historia',
      'histórico',
      'época',
      'periodo',
      'siglo',
      'año',
      'fecha',
      'evento',
      'acontecimiento',
      'guerra',
      'revolución',
      'imperio',
      'civilización',
      'cultura',
      'sociedad',
      'político',
      'social',
      'económico',
      'cronología',
    ],
    'Ciencias Naturales': [
      'biología',
      'química',
      'física',
      'ciencias naturales',
      'experimento',
      'laboratorio',
      'hipótesis',
      'teoría',
      'ley científica',
      'método científico',
      'observación',
      'medición',
      'análisis',
      'ecosistema',
      'célula',
      'molécula',
      'átomo',
      'reacción química',
      'evolución',
    ],
    Filosofía: [
      'filosofía',
      'ética',
      'moral',
      'epistemología',
      'ontología',
      'lógica',
      'razonamiento',
      'argumento',
      'premisa',
      'conclusión',
      'verdad',
      'conocimiento',
      'realidad',
      'existencia',
      'ser',
      'pensamiento',
      'conciencia',
      'libre albedrío',
      'determinismo',
    ],
    Medicina: [
      'medicina',
      'salud',
      'enfermedad',
      'síntoma',
      'diagnóstico',
      'tratamiento',
      'terapia',
      'medicamento',
      'fármaco',
      'paciente',
      'doctor',
      'médico',
      'hospital',
      'clínica',
      'cirugía',
      'anatomía',
      'fisiología',
      'patología',
      'epidemiología',
    ],
    Derecho: [
      'derecho',
      'ley',
      'legal',
      'jurídico',
      'tribunal',
      'juez',
      'abogado',
      'jurisprudencia',
      'código',
      'artículo',
      'norma',
      'reglamento',
      'constitución',
      'penal',
      'civil',
      'comercial',
      'laboral',
      'administrativo',
      'proceso judicial',
    ],
    Idiomas: [
      'idioma',
      'lengua',
      'language',
      'inglés',
      'español',
      'francés',
      'alemán',
      'italiano',
      'portugués',
      'gramática',
      'vocabulario',
      'pronunciación',
      'conversación',
      'traducción',
      'lingüística',
      'fonética',
      'sintaxis',
      'semántica',
    ],
    Psicología: [
      'psicología',
      'comportamiento',
      'conducta',
      'mente',
      'cerebro',
      'cognición',
      'percepción',
      'memoria',
      'aprendizaje',
      'emoción',
      'motivación',
      'personalidad',
      'desarrollo',
      'terapia',
      'psicoterapia',
      'trastorno',
      'psicológico',
      'mental',
      'social',
    ],
    Seguridad: [
      'seguridad',
      'security',
      'ciberseguridad',
      'cybersecurity',
      'vulnerabilidad',
      'amenaza',
      'riesgo',
      'ataque',
      'malware',
      'virus',
      'firewall',
      'antivirus',
      'encriptación',
      'criptografía',
      'hacker',
      'ethical hacking',
      'ssl',
      'tls',
      'authentication',
      'authorization',
    ],
  };

  /**
   * Categoriza un chunk basado en su contenido
   */
  categorizeChunk(chunk: DocumentChunk): CategorizationResult {
    const content = chunk.content.toLowerCase();
    const words = this.extractWords(content);

    let bestCategory = 'General';
    let maxScore = 0;
    let matchedKeywords: string[] = [];

    // Evaluar cada categoría
    for (const [categoryName, keywords] of Object.entries(
      this.categoryKeywords,
    )) {
      const { score, matched } = this.calculateCategoryScore(words, keywords);

      if (score > maxScore) {
        maxScore = score;
        bestCategory = categoryName;
        matchedKeywords = matched;
      }
    }

    // Calcular confianza (normalizada entre 0 y 1)
    const confidence = Math.min(maxScore / 10, 1);

    return {
      categoryId: bestCategory,
      confidence,
      keywords: matchedKeywords,
    };
  }

  /**
   * Categoriza múltiples chunks en lote
   */
  categorizeChunks(chunks: DocumentChunk[]): Map<string, CategorizationResult> {
    const results = new Map<string, CategorizationResult>();

    for (const chunk of chunks) {
      const result = this.categorizeChunk(chunk);
      results.set(chunk.id, result);
    }

    return results;
  }

  /**
   * Extrae palabras relevantes del contenido
   */
  private extractWords(content: string): string[] {
    const cleanContent = content
      .replace(/[^\w\sáéíóúñü]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanContent
      .split(' ')
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  /**
   * Calcula el score de una categoría para un conjunto de palabras
   */
  private calculateCategoryScore(
    words: string[],
    categoryKeywords: string[],
  ): { score: number; matched: string[] } {
    let score = 0;
    const matched: string[] = [];

    for (const keyword of categoryKeywords) {
      const keywordWords = keyword.toLowerCase().split(' ');

      if (keywordWords.length === 1) {
        // Palabra simple
        if (words.includes(keywordWords[0])) {
          score += 1;
          matched.push(keyword);
        }
      } else {
        // Frase de múltiples palabras
        const contentText = words.join(' ');
        if (contentText.includes(keyword.toLowerCase())) {
          score += 2; // Dar más peso a frases exactas
          matched.push(keyword);
        }
      }
    }

    return { score, matched };
  }
}
