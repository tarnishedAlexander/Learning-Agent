/*
  Warnings:

  - Made the column `lastname` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "lastname" SET NOT NULL,
ALTER COLUMN "lastname" DROP DEFAULT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_storedName_key" ON "public"."Document"("storedName");
