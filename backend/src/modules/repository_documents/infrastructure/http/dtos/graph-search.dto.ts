import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GraphSearchRequestDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communityIds?: string[];

  @IsOptional()
  @IsInt()
  maxResults?: number;

  @IsOptional()
  @IsBoolean()
  includeRelatedConcepts?: boolean;

  @IsOptional()
  @IsInt()
  maxHops?: number;

  @IsOptional()
  confidenceThreshold?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationshipTypes?: string[];

  @IsOptional()
  @IsBoolean()
  includeSubgraph?: boolean;
}

export class GraphExtractionOptionsDto {
  @IsOptional()
  entityExtractionOptions?: {
    enabledTypes?: string[];
    confidenceThreshold?: number;
    maxEntitiesPerChunk?: number;
    domainSpecific?: string;
  };
  @IsOptional()
  relationshipExtractionOptions?: {
    enabledTypes?: string[];
    confidenceThreshold?: number;
    maxDistance?: number;
    useSyntacticPatterns?: boolean;
  };
  @IsOptional()
  communityDetectionOptions?: {
    algorithm?: 'leiden' | 'louvain' | 'label_propagation';
    minCommunitySize?: number;
    maxCommunitySize?: number;
  };
  @IsOptional()
  @IsBoolean()
  skipCommunityDetection?: boolean;
}

export class ExtractGraphDataRequestDto {
  @IsString()
  documentId: string;

  @IsString()
  extractedText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentChunkDto)
  chunks: DocumentChunkDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GraphExtractionOptionsDto)
  options?: GraphExtractionOptionsDto;
}

export class DocumentChunkDto {
  @IsString()
  id: string;

  @IsString()
  content: string;

  @IsInt()
  chunkIndex: number;

  @IsInt()
  startPosition: number;

  @IsInt()
  endPosition: number;

  @IsOptional()
  @IsInt()
  pageNumber?: number;
}

export class CommunityStatsDto {
  @IsInt()
  totalCommunities: number;

  @IsInt()
  totalEntities: number;

  @IsInt()
  totalRelationships: number;

  @IsInt()
  averageEntitiesPerCommunity: number;

  @IsInt()
  averageRelationshipsPerCommunity: number;

  @IsArray()
  topCommunitiesBySize: Array<{
    id: string;
    name: string;
    size: number;
  }>;
}
