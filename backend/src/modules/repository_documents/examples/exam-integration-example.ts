/**
 * Example: GraphRAG Integration with Exam Generation
 *
 * This example demonstrates how the GraphRAG system can be integrated
 * with the exam generation module to provide context-aware question generation.
 */

import { IntelligentRoutingService } from '../application/services/intelligent-routing.service';

// Mock implementations for demonstration
class MockCommunityRepository {
  async findRelevantCommunities(query: string, limit: number) {
    // Mock database community
    return [
      {
        community: {
          id: 'db-community-1',
          name: 'Database Systems',
          description:
            'Comprehensive knowledge about database systems, normalization, SQL, and DBMS',
          keyTopics: [
            'database',
            'sql',
            'normalization',
            'acid',
            'transactions',
            'indexing',
          ],
          entityCount: 45,
          relationshipCount: 78,
          documentCount: 12,
          globalSummary:
            'This community contains knowledge about relational databases, SQL operations, normalization forms, and database management systems.',
          hasSummary: () => true,
          hasKeyTopics: () => true,
        },
        relevanceScore: 0.92,
        matchingTopics: ['database', 'sql'],
        matchingEntities: [
          'Database Normalization',
          'SQL Commands',
          'ACID Properties',
        ],
      },
    ];
  }

  async findById(id: string) {
    return {
      id,
      name: 'Database Systems',
      description: 'Database systems community',
      keyTopics: ['database', 'sql', 'normalization'],
      entityCount: 45,
      relationshipCount: 78,
    };
  }

  async getStatistics() {
    return {
      totalCommunities: 5,
      totalEntities: 150,
      totalRelationships: 300,
    };
  }
}

class MockEntityRepository {
  async findByCommunityId(communityId: string) {
    // Mock database entities
    return [
      {
        id: 'entity-1',
        name: 'Database Normalization',
        type: 'CONCEPT',
        description: 'Process of organizing data to reduce redundancy',
        importance: 0.9,
        frequency: 15,
        aliases: ['Normalization', 'Data Normalization'],
      },
      {
        id: 'entity-2',
        name: 'SQL',
        type: 'TECHNOLOGY',
        description: 'Structured Query Language for database operations',
        importance: 0.95,
        frequency: 25,
        aliases: ['Structured Query Language'],
      },
      {
        id: 'entity-3',
        name: 'ACID Properties',
        type: 'CONCEPT',
        description: 'Atomicity, Consistency, Isolation, Durability',
        importance: 0.85,
        frequency: 12,
        aliases: ['ACID'],
      },
      {
        id: 'entity-4',
        name: 'Primary Key',
        type: 'CONCEPT',
        description: 'Unique identifier for database records',
        importance: 0.8,
        frequency: 18,
        aliases: ['PK'],
      },
      {
        id: 'entity-5',
        name: 'Foreign Key',
        type: 'CONCEPT',
        description: 'Reference to primary key in another table',
        importance: 0.75,
        frequency: 14,
        aliases: ['FK'],
      },
    ];
  }
}

class MockGraphQueryRepository {
  async findRelevantCommunities(query: string, limit: number) {
    return [
      {
        community: {
          id: 'db-community-1',
          name: 'Database Systems',
          keyTopics: ['database', 'sql', 'normalization'],
        },
        relevanceScore: 0.92,
        matchingTopics: ['database'],
        matchingEntities: ['SQL', 'Database Normalization'],
      },
    ];
  }

  async getTopicSubgraph(
    topic: string,
    communityIds: string[],
    maxEntities: number,
  ) {
    return {
      topic,
      entities: [
        { id: 'entity-1', name: 'Database Normalization', type: 'CONCEPT' },
        { id: 'entity-2', name: 'SQL', type: 'TECHNOLOGY' },
        { id: 'entity-3', name: 'ACID Properties', type: 'CONCEPT' },
      ],
      relationships: [
        {
          id: 'rel-1',
          sourceId: 'entity-2',
          targetId: 'entity-1',
          type: 'USES',
        },
        {
          id: 'rel-2',
          sourceId: 'entity-1',
          targetId: 'entity-3',
          type: 'ENSURES',
        },
      ],
      communities: [{ id: 'db-community-1', name: 'Database Systems' }],
      relevanceScores: {
        'entity-1': 0.9,
        'entity-2': 0.95,
        'entity-3': 0.85,
      },
    };
  }
}

/**
 * Example: Using GraphRAG for Database Exam Generation
 */
async function generateDatabaseExamWithGraphRAG() {
  console.log('🎓 Database Exam Generation with GraphRAG\n');

  // Initialize the intelligent routing service with mock repositories
  const intelligentRoutingService = new IntelligentRoutingService(
    new MockCommunityRepository() as any,
    new MockEntityRepository() as any,
    new MockGraphQueryRepository() as any,
  );

  try {
    // Step 1: Route the exam generation request
    console.log('Step 1: Routing exam generation request...');

    const routingResult =
      await intelligentRoutingService.routeForExamGeneration(
        'Database Systems',
        'intermediate',
        {
          domain: 'database',
          courseId: 'course-db-101',
          subjectArea: 'database systems',
        },
      );

    console.log(`Query routed successfully!`);
    console.log(`   Original Query: "${routingResult.originalQuery}"`);
    console.log(`   Processed Query: "${routingResult.processedQuery}"`);
    console.log(
      `   Routing Confidence: ${(routingResult.routingConfidence * 100).toFixed(1)}%`,
    );
    console.log(
      `   Recommended Community: ${routingResult.recommendedCommunity?.name || 'None'}`,
    );
    console.log(`   Key Entities Found: ${routingResult.keyEntities.length}`);

    // Step 2: Use the routing result to generate contextual exam questions
    console.log('\nStep 2: Generating contextual exam questions...');

    if (
      routingResult.recommendedCommunity &&
      routingResult.keyEntities.length > 0
    ) {
      // Generate different types of questions based on the entities and relationships
      const examQuestions = generateQuestionsFromGraphData(
        routingResult.keyEntities,
        routingResult.topicSubgraph,
        'intermediate',
      );

      console.log(`Generated ${examQuestions.length} exam questions:`);

      examQuestions.forEach((question, index) => {
        console.log(`\n   Question ${index + 1} (${question.type}):`);
        console.log(`   ${question.text}`);

        if (question.options) {
          question.options.forEach((option, optIndex) => {
            const marker = String.fromCharCode(65 + optIndex); // A, B, C, D
            console.log(`     ${marker}) ${option}`);
          });
          console.log(
            `   Correct Answer: ${String.fromCharCode(65 + question.correctAnswer!)}`,
          );
        }

        console.log(
          `   Context: Based on ${question.sourceEntities.join(', ')}`,
        );
        console.log(`   Difficulty: ${question.difficulty}`);
      });

      // Step 3: Show how the graph context enhances question quality
      console.log('\nStep 3: Graph Context Benefits:');

      console.log('\n   Entity-based Questions:');
      const entityBasedQuestions = examQuestions.filter(
        (q) => q.sourceEntities.length === 1,
      );
      console.log(
        `     - ${entityBasedQuestions.length} questions focus on specific concepts`,
      );

      console.log('\n   Relationship-based Questions:');
      const relationshipBasedQuestions = examQuestions.filter(
        (q) => q.sourceEntities.length > 1,
      );
      console.log(
        `     - ${relationshipBasedQuestions.length} questions test understanding of connections`,
      );

      console.log('\n   Community Context:');
      console.log(
        `     - All questions are contextually relevant to "${routingResult.recommendedCommunity.name}"`,
      );
      console.log(
        `     - Questions cover key topics: ${routingResult.recommendedCommunity.keyTopics?.join(', ')}`,
      );

      // Step 4: Show suggested refinements
      if (routingResult.suggestedRefinements.length > 0) {
        console.log('\n Suggested Improvements:');
        routingResult.suggestedRefinements.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion}`);
        });
      }
    } else {
      console.log(' No suitable community found for exam generation');
    }

    console.log('\n Performance Metrics:');
    console.log(
      `   Processing Time: ${routingResult.metadata.processingTimeMs}ms`,
    );
    console.log(
      `   Query Complexity: ${routingResult.metadata.queryComplexity}`,
    );
    console.log(
      `   Domain Specificity: ${(routingResult.metadata.domainSpecificity * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error(' Exam generation failed:', error.message);
  }
}

/**
 * Generate exam questions based on graph data
 */
function generateQuestionsFromGraphData(
  entities: any[],
  topicSubgraph: any,
  difficulty: string,
) {
  const questions: any[] = [];

  // Generate multiple choice questions from entities
  entities.slice(0, 3).forEach((entity) => {
    if (entity.name === 'Database Normalization') {
      questions.push({
        type: 'multiple_choice',
        text: `What is the primary purpose of database normalization?`,
        options: [
          'To increase data redundancy',
          'To reduce data redundancy and improve data integrity',
          'To make queries run slower',
          'To increase storage requirements',
        ],
        correctAnswer: 1,
        sourceEntities: [entity.name],
        difficulty: difficulty,
        explanation:
          'Database normalization reduces redundancy and improves data integrity by organizing data efficiently.',
      });
    }

    if (entity.name === 'SQL') {
      questions.push({
        type: 'multiple_choice',
        text: `Which SQL command is used to retrieve data from a database?`,
        options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
        correctAnswer: 2,
        sourceEntities: [entity.name],
        difficulty: difficulty,
        explanation:
          'SELECT is the SQL command used to retrieve data from database tables.',
      });
    }

    if (entity.name === 'ACID Properties') {
      questions.push({
        type: 'true_false',
        text: `ACID properties ensure database transactions are processed reliably.`,
        correctAnswer: true,
        sourceEntities: [entity.name],
        difficulty: difficulty,
        explanation:
          'ACID (Atomicity, Consistency, Isolation, Durability) properties ensure reliable transaction processing.',
      });
    }
  });

  // Generate relationship-based questions
  if (topicSubgraph && topicSubgraph.relationships.length > 0) {
    questions.push({
      type: 'multiple_choice',
      text: `What is the relationship between SQL and database normalization?`,
      options: [
        'SQL prevents normalization',
        'SQL is used to implement normalized database structures',
        'They are unrelated concepts',
        'Normalization replaces SQL',
      ],
      correctAnswer: 1,
      sourceEntities: ['SQL', 'Database Normalization'],
      difficulty: difficulty,
      explanation:
        'SQL is used to create and manage normalized database structures through DDL and DML commands.',
    });
  }

  // Generate open-ended questions for higher difficulty
  if (difficulty === 'advanced') {
    questions.push({
      type: 'open_analysis',
      text: `Explain how the ACID properties work together to ensure database consistency, and provide an example of a scenario where each property is crucial.`,
      sourceEntities: ['ACID Properties', 'Database Normalization'],
      difficulty: difficulty,
      expectedAnswer:
        'Students should explain Atomicity (all-or-nothing transactions), Consistency (valid state transitions), Isolation (concurrent transaction handling), and Durability (permanent storage), with relevant examples.',
    });
  }

  return questions;
}

/**
 * Example: Document Processing with GraphRAG
 */
async function processDocumentWithGraphRAG() {
  console.log('\n Document Processing with GraphRAG\n');

  const sampleDocument = {
    id: 'doc-db-textbook-ch3',
    title: 'Database Design and Normalization',
    content: `
      Chapter 3: Database Design and Normalization
      
      Database design is a critical aspect of creating efficient and maintainable database systems.
      The normalization process helps eliminate data redundancy and ensures data integrity.
      
      First Normal Form (1NF) requires that all attributes contain atomic values.
      Second Normal Form (2NF) eliminates partial dependencies on composite keys.
      Third Normal Form (3NF) removes transitive dependencies.
      
      SQL DDL commands like CREATE TABLE are used to implement these normalized structures.
    `,
  };

  console.log(` Processing document: "${sampleDocument.title}"`);
  console.log(` Content length: ${sampleDocument.content.length} characters`);

  // Simulate the GraphRAG processing pipeline
  console.log('\n GraphRAG Processing Pipeline:');
  console.log('   1. Text extraction completed');
  console.log('   2. Document chunking completed (3 chunks)');
  console.log('   3. Entity extraction completed (12 entities found)');
  console.log(
    '   4.  Relationship extraction completed (8 relationships found)',
  );
  console.log('   5. Community detection completed (1 community assigned)');
  console.log('   6. Document indexed in "Database Systems" community');

  console.log('\n Extraction Results:');
  console.log(
    '    Key Entities: Database Design, Normalization, 1NF, 2NF, 3NF, SQL DDL',
  );
  console.log(
    '    Key Relationships: 1NF → 2NF → 3NF (progression), SQL DDL → Normalization (implements)',
  );
  console.log('    Assigned Community: Database Systems (confidence: 94%)');

  console.log(
    '\n Document successfully processed and indexed for future exam generation!',
  );
}

// Export functions for use in other modules
export { generateDatabaseExamWithGraphRAG, processDocumentWithGraphRAG };

// Run examples if this file is executed directly
if (require.main === module) {
  async function runExamples() {
    await generateDatabaseExamWithGraphRAG();
    await processDocumentWithGraphRAG();
  }

  runExamples().catch(console.error);
}
