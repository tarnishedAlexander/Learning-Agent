-- CreateTable
CREATE TABLE "public"."Exam" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exam_subject_idx" ON "public"."Exam"("subject");
