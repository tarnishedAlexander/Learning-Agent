-- Enum 
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionKind') THEN
    CREATE TYPE "public"."QuestionKind" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ANALYSIS', 'OPEN_EXERCISE');
  END IF;
END$$;

-- Exam: agregar columnas de forma segura
ALTER TABLE "public"."Exam"
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- updatedAt primero nullable para no romper si hay filas
ALTER TABLE "public"."Exam"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Backfill para filas existentes donde updatedAt esté NULL
UPDATE "public"."Exam" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- NOT NULL 
ALTER TABLE "public"."Exam"
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ExamQuestion: crear tabla si no existe 
DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'ExamQuestion'
) THEN
  CREATE TABLE "public"."ExamQuestion" (
      "id" TEXT NOT NULL,
      "examId" TEXT NOT NULL,
      "kind" "public"."QuestionKind" NOT NULL,
      "text" TEXT NOT NULL,
      "options" JSONB,
      "correctOptionIndex" INTEGER,
      "correctBoolean" BOOLEAN,
      "expectedAnswer" TEXT,
      "order" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
  );

  CREATE INDEX "ExamQuestion_examId_order_idx" ON "public"."ExamQuestion"("examId", "order");
  CREATE UNIQUE INDEX "ExamQuestion_examId_order_key" ON "public"."ExamQuestion"("examId", "order");

  ALTER TABLE "public"."ExamQuestion"
    ADD CONSTRAINT "ExamQuestion_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END$$;
