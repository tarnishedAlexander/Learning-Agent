import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  QueryByCommunityUseCase,
  QueryByCommunityCommand,
  CommunityQueryResult,
} from '../../application/use-cases/query-by-community.use-case';
import {
  ExtractGraphDataUseCase,
  ExtractGraphDataCommand,
  GraphExtractionResult,
} from '../../application/use-cases/extract-graph-data.use-case';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import type { EntityRepository } from '../../domain/repositories/entity.repository';
import type { RelationshipRepository } from '../../domain/repositories/relationship.repository';
import type { GraphQueryRepository } from '../../domain/repositories/graph-query.repository';
import type { EntityType } from '../../domain/entities/entity.entity';
import type { RelationshipType } from '../../domain/entities/relationship.entity';
import type { Entity as DomainEntity } from '../../domain/entities/entity.entity';
import {
  GraphSearchRequestDto,
  ExtractGraphDataRequestDto,
  CommunityStatsDto,
} from './dtos/graph-search.dto';

@ApiTags('Graph Search')
@Controller('graph-search')
export class GraphSearchController {
  constructor(
    private readonly queryByCommunityUseCase: QueryByCommunityUseCase,
    private readonly extractGraphDataUseCase: ExtractGraphDataUseCase,
    private readonly communityRepository: CommunityRepository,
    private readonly entityRepository: EntityRepository,
    private readonly relationshipRepository: RelationshipRepository,
    private readonly graphQueryRepository: GraphQueryRepository,
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Search knowledge graph by community' })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchByCommunity(
    @Body() request: GraphSearchRequestDto,
  ): Promise<CommunityQueryResult> {
    try {
      const command: QueryByCommunityCommand = {
        query: request.query,
        communityIds: request.communityIds,
        options: {
          maxResults: request.maxResults,
          includeRelatedConcepts: request.includeRelatedConcepts,
          maxHops: request.maxHops,
          confidenceThreshold: request.confidenceThreshold,
          entityTypes: request.entityTypes,
          relationshipTypes: request.relationshipTypes,
          includeSubgraph: request.includeSubgraph,
        },
      };

      return await this.queryByCommunityUseCase.execute(command);
    } catch (error) {
      throw new HttpException(
        `Graph search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract graph data from document' })
  @ApiResponse({
    status: 200,
    description: 'Graph data extracted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid extraction parameters' })
  async extractGraphData(
    @Body() request: ExtractGraphDataRequestDto,
  ): Promise<GraphExtractionResult> {
    try {
      const command: ExtractGraphDataCommand = {
        documentId: request.documentId,
        extractedText: request.extractedText,
        chunks: request.chunks,
        options: request.options
          ? {
              ...request.options,
              entityExtractionOptions: request.options.entityExtractionOptions
                ? {
                    ...request.options.entityExtractionOptions,
                    enabledTypes: request.options.entityExtractionOptions
                      .enabledTypes
                      ? (request.options.entityExtractionOptions
                          .enabledTypes as EntityType[])
                      : undefined,
                  }
                : undefined,
              relationshipExtractionOptions: request.options
                .relationshipExtractionOptions
                ? {
                    ...request.options.relationshipExtractionOptions,
                    enabledTypes: request.options.relationshipExtractionOptions
                      .enabledTypes
                      ? (request.options.relationshipExtractionOptions
                          .enabledTypes as unknown as import('../../domain/entities/relationship.entity').RelationshipType[])
                      : undefined,
                  }
                : undefined,
            }
          : undefined,
      };

      return await this.extractGraphDataUseCase.execute(command);
    } catch (error) {
      throw new HttpException(
        `Graph extraction failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities')
  @ApiOperation({ summary: 'Get all communities' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for communities',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Communities retrieved successfully',
  })
  async getCommunities(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      if (search) {
        return await this.communityRepository.search(search);
      } else {
        const communities = await this.communityRepository.findAll();
        return limit ? communities.slice(0, limit) : communities;
      }
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve communities: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id')
  @ApiOperation({ summary: 'Get community by ID' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({ status: 200, description: 'Community retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  async getCommunityById(@Param('id') id: string) {
    try {
      const community = await this.communityRepository.findById(id);
      if (!community) {
        throw new HttpException('Community not found', HttpStatus.NOT_FOUND);
      }
      return community;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve community: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id/entities')
  @ApiOperation({ summary: 'Get entities in a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by entity type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  async getCommunityEntities(
    @Param('id') communityId: string,
    @Query('type') type?: EntityType,
    @Query('limit') limit?: number,
  ) {
    try {
      let entities;
      if (type) {
        entities = await this.entityRepository.findByTypeAndCommunity(
          type,
          communityId,
        );
      } else {
        entities = await this.entityRepository.findByCommunityId(communityId);
      }

      return limit ? entities.slice(0, limit) : entities;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve community entities: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id/relationships')
  @ApiOperation({ summary: 'Get relationships in a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by relationship type',
  })
  @ApiQuery({
    name: 'minStrength',
    required: false,
    description: 'Minimum relationship strength',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Relationships retrieved successfully',
  })
  async getCommunityRelationships(
    @Param('id') communityId: string,
    @Query('type') type?: string,
    @Query('minStrength') minStrength?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      let relationships: Array<{ strength: number }> = [];

      if (type) {
        relationships =
          (await this.relationshipRepository.findByTypeAndCommunity(
            type as RelationshipType,
            communityId,
          )) as Array<{ strength: number }>;
      } else {
        relationships = (await this.relationshipRepository.findByCommunityId(
          communityId,
        )) as Array<{ strength: number }>;
      }

      if (minStrength !== undefined) {
        relationships = relationships.filter(
          (rel: { strength: number }) => rel.strength >= minStrength,
        );
      }

      return limit ? relationships.slice(0, limit) : relationships;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve community relationships: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('entities/:id/related')
  @ApiOperation({ summary: 'Get entities related to a specific entity' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiQuery({
    name: 'maxHops',
    required: false,
    description: 'Maximum number of hops',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Related entities retrieved successfully',
  })
  async getRelatedEntities(
    @Param('id') entityId: string,
    @Query('maxHops') maxHops?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const connectedEntityIds =
        await this.relationshipRepository.findConnectedEntities(
          entityId,
          maxHops || 2,
        );

      const relatedEntities: DomainEntity[] = [];
      for (const id of connectedEntityIds.slice(0, limit || 20)) {
        const entity = await this.entityRepository.findById(id);
        if (entity) {
          relatedEntities.push(entity);
        }
      }

      return relatedEntities;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve related entities: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('graph/structure')
  @ApiOperation({ summary: 'Get graph structure for visualization' })
  @ApiQuery({
    name: 'communityIds',
    required: false,
    description: 'Comma-separated community IDs',
  })
  @ApiQuery({
    name: 'includeWeakRelationships',
    required: false,
    description: 'Include weak relationships',
  })
  @ApiResponse({
    status: 200,
    description: 'Graph structure retrieved successfully',
  })
  async getGraphStructure(
    @Query('communityIds') communityIds?: string,
    @Query('includeWeakRelationships') includeWeakRelationships?: boolean,
  ) {
    try {
      const communityIdArray = communityIds
        ? communityIds.split(',')
        : undefined;

      return await this.graphQueryRepository.getGraphStructure(
        communityIdArray,
        includeWeakRelationships,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve graph structure: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get graph statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getGraphStats(): Promise<CommunityStatsDto> {
    try {
      const communityStats = await this.communityRepository.getStatistics();

      return {
        totalCommunities: communityStats.totalCommunities,
        totalEntities: communityStats.totalEntities,
        totalRelationships: communityStats.totalRelationships,
        averageEntitiesPerCommunity: communityStats.averageEntitiesPerCommunity,
        averageRelationshipsPerCommunity:
          communityStats.averageRelationshipsPerCommunity,
        topCommunitiesBySize: communityStats.topCommunitiesBySize,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve graph statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/semantic')
  @ApiOperation({
    summary: 'Perform semantic search across the knowledge graph',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'communityIds',
    required: false,
    description: 'Comma-separated community IDs',
  })
  @ApiQuery({
    name: 'entityTypes',
    required: false,
    description: 'Comma-separated entity types',
  })
  @ApiQuery({
    name: 'relationshipTypes',
    required: false,
    description: 'Comma-separated relationship types',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Semantic search results retrieved successfully',
  })
  async semanticSearch(
    @Query('query') query: string,
    @Query('communityIds') communityIds?: string,
    @Query('entityTypes') entityTypes?: string,
    @Query('relationshipTypes') relationshipTypes?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const communityIdArray = communityIds
        ? communityIds.split(',')
        : undefined;
      const entityTypeArray = entityTypes ? entityTypes.split(',') : undefined;
      const relationshipTypeArray = relationshipTypes
        ? relationshipTypes.split(',')
        : undefined;

      const result = await this.graphQueryRepository.semanticSearch(
        query,
        communityIdArray,
        entityTypeArray,
        relationshipTypeArray,
      );

      // Limit results if specified
      if (limit) {
        result.entities = result.entities.slice(0, limit);
        result.relationships = result.relationships.slice(0, limit);
        result.communities = result.communities.slice(0, limit);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        `Semantic search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id/subgraph')
  @ApiOperation({ summary: 'Get topic subgraph for a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiQuery({
    name: 'topic',
    required: false,
    description: 'Specific topic to focus on',
  })
  @ApiQuery({
    name: 'maxEntities',
    required: false,
    description: 'Maximum number of entities',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic subgraph retrieved successfully',
  })
  async getTopicSubgraph(
    @Param('id') communityId: string,
    @Query('topic') topic?: string,
    @Query('maxEntities') maxEntities?: number,
  ) {
    try {
      // If no topic specified, use the community name as the topic
      if (!topic) {
        const community = await this.communityRepository.findById(communityId);
        topic = community?.name || 'general';
      }

      return await this.graphQueryRepository.getTopicSubgraph(
        topic,
        [communityId],
        maxEntities || 50,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve topic subgraph: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id/gaps')
  @ApiOperation({ summary: 'Find knowledge gaps in a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge gaps identified successfully',
  })
  async findKnowledgeGaps(@Param('id') communityId: string) {
    try {
      return await this.graphQueryRepository.findKnowledgeGaps(communityId);
    } catch (error) {
      throw new HttpException(
        `Failed to find knowledge gaps: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('communities/:id/connectivity')
  @ApiOperation({ summary: 'Analyze connectivity of a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({
    status: 200,
    description: 'Connectivity analysis completed successfully',
  })
  async analyzeConnectivity(@Param('id') communityId: string) {
    try {
      return await this.graphQueryRepository.analyzeConnectivity(communityId);
    } catch (error) {
      throw new HttpException(
        `Failed to analyze connectivity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
