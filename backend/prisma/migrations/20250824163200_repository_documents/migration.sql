/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileHash` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ProcessingType" AS ENUM ('TEXT_EXTRACTION', 'CHUNKING', 'EMBEDDING_GENERATION', 'FULL_PROCESSING', 'REPROCESSING');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."ChunkType" AS ENUM ('TEXT', 'TITLE', 'TABLE', 'LIST', 'CODE', 'FORMULA', 'METADATA');

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
CREATE TABLE "public"."DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startPosition" INTEGER NOT NULL,
    "endPosition" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "chunkType" "public"."ChunkType" NOT NULL DEFAULT 'TEXT',
    "embedding" public.vector(1536),
    "metadata" JSONB,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "public"."DocumentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "public"."DocumentChunk"("documentId", "chunkIndex");

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

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCategoryMapping" ADD CONSTRAINT "DocumentCategoryMapping_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCategoryMapping" ADD CONSTRAINT "DocumentCategoryMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."DocumentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessingJob" ADD CONSTRAINT "ProcessingJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
