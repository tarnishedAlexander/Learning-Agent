import { EntityExtractor } from './infrastructure/graph/entity-extractor';
import { RelationshipExtractor } from './infrastructure/graph/relationship-extractor';
import { CommunityDetector } from './infrastructure/graph/community-detector';
import { EntityType } from './domain/entities/entity.entity';
import { RelationshipType } from './domain/entities/relationship.entity';

/**
 * Test script for GraphRAG functionality
 * This script demonstrates the core GraphRAG features without requiring a full NestJS setup
 */

async function testGraphRAG() {
  console.log(' Starting GraphRAG Test...\n');

  // Sample document text about databases
  const sampleText = `
    Database normalization is a process used in relational database design to organize data 
    efficiently and reduce redundancy. The process involves dividing large tables into smaller, 
    more manageable tables and defining relationships between them.

    First Normal Form (1NF) requires that each column contains atomic values and each record 
    is unique. Second Normal Form (2NF) builds on 1NF by ensuring that all non-key attributes 
    are fully functionally dependent on the primary key. Third Normal Form (3NF) eliminates 
    transitive dependencies.

    SQL (Structured Query Language) is used to interact with relational databases. Common SQL 
    commands include SELECT for retrieving data, INSERT for adding new records, UPDATE for 
    modifying existing data, and DELETE for removing records.

    Database Management Systems (DBMS) like MySQL, PostgreSQL, and Oracle provide the software 
    infrastructure for managing databases. These systems handle data storage, retrieval, and 
    ensure data integrity through ACID properties (Atomicity, Consistency, Isolation, Durability).
  `;

  // Sample document chunks
  const chunks = [
    {
      id: 'chunk-1',
      content: sampleText.substring(0, 300),
      chunkIndex: 0,
      startPosition: 0,
      endPosition: 300,
      pageNumber: 1,
    },
    {
      id: 'chunk-2',
      content: sampleText.substring(300, 600),
      chunkIndex: 1,
      startPosition: 300,
      endPosition: 600,
      pageNumber: 1,
    },
    {
      id: 'chunk-3',
      content: sampleText.substring(600),
      chunkIndex: 2,
      startPosition: 600,
      endPosition: sampleText.length,
      pageNumber: 1,
    },
  ];

  try {
    // Step 1: Test Entity Extraction
    console.log(' Step 1: Testing Entity Extraction...');
    const entityExtractor = new EntityExtractor();

    const entityExtractionResult = await entityExtractor.extractFromChunks(
      chunks,
      {
        enabledTypes: [
          EntityType.CONCEPT,
          EntityType.TECHNOLOGY,
          EntityType.ALGORITHM,
        ],
        confidenceThreshold: 0.4,
        domainSpecific: 'database',
      },
    );

    console.log(` Extracted ${entityExtractionResult.length} chunk results`);

    // Combine all entities
    const allEntities = entityExtractionResult.flatMap(
      (result) => result.entities,
    );
    console.log(` Total entities found: ${allEntities.length}`);

    // Show top entities
    const topEntities = allEntities
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    console.log('\n Top Entities:');
    topEntities.forEach((entity, index) => {
      console.log(
        `  ${index + 1}. ${entity.name} (${entity.type}) - Confidence: ${entity.confidence.toFixed(2)}`,
      );
    });

    // Step 2: Test Relationship Extraction
    console.log('\n Step 2: Testing Relationship Extraction...');
    const relationshipExtractor = new RelationshipExtractor();

    const relationshipExtractionResult =
      await relationshipExtractor.extractFromChunks(chunks, allEntities, {
        enabledTypes: [
          RelationshipType.IS_A,
          RelationshipType.PART_OF,
          RelationshipType.USES,
        ],
        confidenceThreshold: 0.4,
        maxDistance: 100,
      });

    console.log(
      ` Extracted ${relationshipExtractionResult.length} chunk results`,
    );

    // Combine all relationships
    const allRelationships = relationshipExtractionResult.flatMap(
      (result) => result.relationships,
    );
    console.log(` Total relationships found: ${allRelationships.length}`);

    // Show top relationships
    const topRelationships = allRelationships
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    console.log('\n Top Relationships:');
    topRelationships.forEach((rel, index) => {
      console.log(
        `  ${index + 1}. ${rel.sourceEntity} --[${rel.type}]--> ${rel.targetEntity} (${rel.confidence.toFixed(2)})`,
      );
    });

    // Step 3: Test Community Detection
    console.log('\n Step 3: Testing Community Detection...');
    const communityDetector = new CommunityDetector();

    // Convert extracted entities to domain entities for community detection
    const domainEntities = allEntities.map((entity) => ({
      id: `entity_${Math.random().toString(36).substr(2, 9)}`,
      name: entity.name,
      type: entity.type,
      communityId: 'temp',
      description: entity.description,
      frequency: 1,
      importance: entity.confidence,
      aliases: entity.aliases,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Convert extracted relationships to domain relationships
    const domainRelationships = allRelationships
      .map((rel) => ({
        id: `rel_${Math.random().toString(36).substr(2, 9)}`,
        sourceId:
          domainEntities.find((e) => e.name === rel.sourceEntity)?.id ||
          'unknown',
        targetId:
          domainEntities.find((e) => e.name === rel.targetEntity)?.id ||
          'unknown',
        type: rel.type,
        communityId: 'temp',
        description: rel.description,
        strength: rel.confidence,
        documentSources: ['test-doc'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      .filter(
        (rel) => rel.sourceId !== 'unknown' && rel.targetId !== 'unknown',
      );

    const detectedCommunities = await communityDetector.detectCommunities(
      domainEntities as any,
      domainRelationships as any,
      {
        algorithm: 'leiden',
        minCommunitySize: 2,
        maxCommunitySize: 20,
      },
    );

    console.log(` Detected ${detectedCommunities.length} communities`);

    console.log('\n Detected Communities:');
    detectedCommunities.forEach((community, index) => {
      console.log(`  ${index + 1}. ${community.name}`);
      console.log(`     - Entities: ${community.entities.length}`);
      console.log(`     - Relationships: ${community.relationships.length}`);
      console.log(`     - Quality: ${community.quality.toFixed(2)}`);
      console.log(`     - Key Topics: ${community.keyTopics.join(', ')}`);
      console.log(`     - Description: ${community.description}`);
      console.log('');
    });

    // Step 4: Test Query Processing
    console.log(' Step 4: Testing Query Processing...');

    const testQueries = [
      'database normalization',
      'SQL commands',
      'ACID properties',
      'relational database design',
    ];

    for (const query of testQueries) {
      console.log(`\n Query: "${query}"`);

      // Simple query matching against entities
      const matchingEntities = allEntities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(query.toLowerCase()) ||
          query
            .toLowerCase()
            .split(' ')
            .some((term) => entity.name.toLowerCase().includes(term)),
      );

      console.log(`   Matching entities: ${matchingEntities.length}`);
      matchingEntities.slice(0, 3).forEach((entity) => {
        console.log(`     - ${entity.name} (${entity.type})`);
      });

      // Find relevant community
      const relevantCommunity = detectedCommunities.find((community) =>
        community.keyTopics.some(
          (topic) =>
            topic.toLowerCase().includes(query.toLowerCase()) ||
            query.toLowerCase().includes(topic.toLowerCase()),
        ),
      );

      if (relevantCommunity) {
        console.log(`   Relevant community: ${relevantCommunity.name}`);
      }
    }

    // Summary
    console.log('\n GraphRAG Test Summary:');
    console.log(`   Entities extracted: ${allEntities.length}`);
    console.log(`   Relationships found: ${allRelationships.length}`);
    console.log(`   Communities detected: ${detectedCommunities.length}`);
    console.log(
      `   Average entity confidence: ${(allEntities.reduce((sum, e) => sum + e.confidence, 0) / allEntities.length).toFixed(2)}`,
    );
    console.log(
      `   Average relationship confidence: ${(allRelationships.reduce((sum, r) => sum + r.confidence, 0) / allRelationships.length).toFixed(2)}`,
    );

    console.log('\nGraphRAG Test Completed Successfully!');
  } catch (error) {
    console.error('GraphRAG Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Export for potential use in other test files
export { testGraphRAG };

// Run the test if this file is executed directly
if (require.main === module) {
  testGraphRAG().catch(console.error);
}
