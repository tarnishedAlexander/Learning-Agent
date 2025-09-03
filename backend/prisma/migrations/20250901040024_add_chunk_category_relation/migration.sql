-- AlterTable
ALTER TABLE "public"."document_chunks" ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "document_chunks_categoryId_idx" ON "public"."document_chunks"("categoryId");

-- AddForeignKey
ALTER TABLE "public"."document_chunks" ADD CONSTRAINT "document_chunks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
