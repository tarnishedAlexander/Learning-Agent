/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileHash` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ProcessingType" AS ENUM ('TEXT_EXTRACTION', 'CHUNKING', 'EMBEDDING_GENERATION', 'FULL_PROCESSING', 'REPROCESSING', 'GRAPH_EXTRACTION', 'COMMUNITY_DETECTION', 'COMMUNITY_SUMMARIZATION');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."ChunkType" AS ENUM ('TEXT', 'TITLE', 'TABLE', 'LIST', 'CODE', 'FORMULA', 'METADATA');

-- CreateEnum for GraphRAG
CREATE TYPE "public"."EntityType" AS ENUM ('PERSON', 'CONCEPT', 'TECHNOLOGY', 'METHODOLOGY', 'TOOL', 'ALGORITHM', 'DATA_STRUCTURE', 'PROGRAMMING_LANGUAGE', 'FRAMEWORK', 'ORGANIZATION', 'LOCATION', 'OTHER');

-- CreateEnum for GraphRAG
CREATE TYPE "public"."RelationshipType" AS ENUM ('IS_A', 'PART_OF', 'USES', 'IMPLEMENTS', 'EXTENDS', 'DEPENDS_ON', 'SIMILAR_TO', 'OPPOSITE_OF', 'CAUSES', 'ENABLES', 'REQUIRES', 'CONTAINS', 'RELATED_TO', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "documentAuthor" TEXT,
ADD COLUMN     "documentTitle" TEXT,
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "fileHash" TEXT NOT NULL,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "status" "public"."DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startPosition" INTEGER NOT NULL,
    "endPosition" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'text',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" public.vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCategoryMapping" (
    "documentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCategoryMapping_pkey" PRIMARY KEY ("documentId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."ProcessingJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "jobType" "public"."ProcessingType" NOT NULL,
    "status" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "jobDetails" JSONB,
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- GraphRAG Tables
-- CreateTable
CREATE TABLE "public"."Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "entityCount" INTEGER NOT NULL DEFAULT 0,
    "relationshipCount" INTEGER NOT NULL DEFAULT 0,
    "globalSummary" TEXT,
    "keyTopics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."EntityType" NOT NULL,
    "description" TEXT,
    "communityId" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "aliases" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Relationship" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "public"."RelationshipType" NOT NULL,
    "description" TEXT,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "communityId" TEXT NOT NULL,
    "documentSources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCommunity" (
    "documentId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCommunity_pkey" PRIMARY KEY ("documentId","communityId")
);

-- CreateTable
CREATE TABLE "public"."DocumentEntityMention" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "startPosition" INTEGER NOT NULL,
    "endPosition" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "public"."document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "document_chunks_type_idx" ON "public"."document_chunks"("type");

-- CreateIndex
CREATE INDEX "document_chunks_wordCount_idx" ON "public"."document_chunks"("wordCount");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkIndex_key" ON "public"."document_chunks"("documentId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_name_key" ON "public"."DocumentCategory"("name");

-- CreateIndex
CREATE INDEX "ProcessingJob_documentId_jobType_idx" ON "public"."ProcessingJob"("documentId", "jobType");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_idx" ON "public"."ProcessingJob"("status");

-- CreateIndex
CREATE INDEX "ProcessingJob_createdAt_idx" ON "public"."ProcessingJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileHash_key" ON "public"."Document"("fileHash");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "public"."Document"("status");

-- CreateIndex
CREATE INDEX "Document_uploadedBy_idx" ON "public"."Document"("uploadedBy");

-- CreateIndex
CREATE INDEX "Document_fileHash_idx" ON "public"."Document"("fileHash");

-- CreateIndex
CREATE INDEX "Document_contentType_idx" ON "public"."Document"("contentType");

-- GraphRAG Indexes
-- CreateIndex
CREATE INDEX "Community_name_idx" ON "public"."Community"("name");

-- CreateIndex
CREATE INDEX "Community_level_idx" ON "public"."Community"("level");

-- CreateIndex
CREATE INDEX "Community_parentId_idx" ON "public"."Community"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_name_communityId_key" ON "public"."Entity"("name", "communityId");

-- CreateIndex
CREATE INDEX "Entity_communityId_idx" ON "public"."Entity"("communityId");

-- CreateIndex
CREATE INDEX "Entity_type_idx" ON "public"."Entity"("type");

-- CreateIndex
CREATE INDEX "Entity_importance_idx" ON "public"."Entity"("importance");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_sourceId_targetId_type_communityId_key" ON "public"."Relationship"("sourceId", "targetId", "type", "communityId");

-- CreateIndex
CREATE INDEX "Relationship_communityId_idx" ON "public"."Relationship"("communityId");

-- CreateIndex
CREATE INDEX "Relationship_type_idx" ON "public"."Relationship"("type");

-- CreateIndex
CREATE INDEX "Relationship_strength_idx" ON "public"."Relationship"("strength");

-- CreateIndex
CREATE INDEX "DocumentCommunity_relevance_idx" ON "public"."DocumentCommunity"("relevance");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentEntityMention_entityId_chunkId_startPosition_key" ON "public"."DocumentEntityMention"("entityId", "chunkId", "startPosition");

-- CreateIndex
CREATE INDEX "DocumentEntityMention_entityId_idx" ON "public"."DocumentEntityMention"("entityId");

-- CreateIndex
CREATE INDEX "DocumentEntityMention_chunkId_idx" ON "public"."DocumentEntityMention"("chunkId");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCategoryMapping" ADD CONSTRAINT "DocumentCategoryMapping_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCategoryMapping" ADD CONSTRAINT "DocumentCategoryMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."DocumentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessingJob" ADD CONSTRAINT "ProcessingJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GraphRAG Foreign Keys
-- AddForeignKey
ALTER TABLE "public"."Community" ADD CONSTRAINT "Community_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entity" ADD CONSTRAINT "Entity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCommunity" ADD CONSTRAINT "DocumentCommunity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCommunity" ADD CONSTRAINT "DocumentCommunity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentEntityMention" ADD CONSTRAINT "DocumentEntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "public"."Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentEntityMention" ADD CONSTRAINT "DocumentEntityMention_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "public"."document_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
