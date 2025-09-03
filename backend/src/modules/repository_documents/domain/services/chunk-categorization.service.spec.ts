import { Test, TestingModule } from '@nestjs/testing';
import { ChunkCategorizationService } from './chunk-categorization.service';
import { DocumentCategoryRepositoryPort } from '../ports/document-category-repository.port';
import { DocumentCategory } from '../entities/document-category.entity';

describe('ChunkCategorizationService Integration Test', () => {
  let service: ChunkCategorizationService;
  let mockRepository: jest.Mocked<DocumentCategoryRepositoryPort>;

  beforeEach(async () => {
    // Create mock categories for testing
    const mockCategories = [
      new DocumentCategory(
        '1',
        'Programación',
        'Desarrollo de software y programación',
        '#3498db',
        'code',
        new Date(),
        new Date(),
      ),
      new DocumentCategory(
        '2',
        'Bases de Datos',
        'Sistemas de gestión de bases de datos',
        '#e74c3c',
        'database',
        new Date(),
        new Date(),
      ),
      new DocumentCategory(
        '3',
        'Inteligencia Artificial',
        'IA, Machine Learning y tecnologías relacionadas',
        '#9b59b6',
        'brain',
        new Date(),
        new Date(),
      ),
    ];

    mockRepository = {
      findAll: jest.fn().mockResolvedValue(mockCategories),
      findById: jest.fn(),
      findByName: jest.fn(),
      findMostUsed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChunkCategorizationService,
        {
          provide: 'DOCUMENT_CATEGORY_REPOSITORY_PORT',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChunkCategorizationService>(
      ChunkCategorizationService,
    );
  });

  it('should categorize programming content correctly', async () => {
    const programmingText =
      'En JavaScript, las funciones se pueden declarar usando la palabra clave function y arrow functions.';

    const result = await service.categorizeChunk(programmingText);

    expect(result).toBeDefined();
    expect(result?.name).toBe('Programación');
    expect(result?.confidence).toBeGreaterThan(0);
  });

  it('should categorize database content correctly', async () => {
    const databaseText =
      'SELECT usuarios.nombre, pedidos.total FROM usuarios JOIN pedidos ON usuarios.id = pedidos.usuario_id WHERE pedidos.fecha > "2024-01-01"';

    const result = await service.categorizeChunk(databaseText);

    expect(result).toBeDefined();
    expect(result?.name).toBe('Bases de Datos');
    expect(result?.confidence).toBeGreaterThan(0);
  });

  it('should categorize AI content correctly', async () => {
    const aiText =
      'Las redes neuronales artificiales utilizan algoritmos de machine learning para entrenar modelos de inteligencia artificial.';

    const result = await service.categorizeChunk(aiText);

    expect(result).toBeDefined();
    expect(result?.name).toBe('Inteligencia Artificial');
    expect(result?.confidence).toBeGreaterThan(0);
  });

  it('should return null for unrecognizable content', async () => {
    const unrecognizableText =
      'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt.';

    const result = await service.categorizeChunk(unrecognizableText);

    expect(result).toBeNull();
  });

  it('should handle empty text', async () => {
    const result = await service.categorizeChunk('');

    expect(result).toBeNull();
  });

  it('should categorize chunks in batch', async () => {
    const chunks = [
      'Python es un lenguaje de programación interpretado',
      'MongoDB es una base de datos NoSQL',
      'TensorFlow es una librería de machine learning',
      'Lorem ipsum dolor sit amet',
    ];

    const results = await service.categorizeChunks(chunks);

    expect(results).toHaveLength(4);
    expect(results[0]?.name).toBe('Programación');
    expect(results[1]?.name).toBe('Bases de Datos');
    expect(results[2]?.name).toBe('Inteligencia Artificial');
    expect(results[3]).toBeNull();
  });
});
