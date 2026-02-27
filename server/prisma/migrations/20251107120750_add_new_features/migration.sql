-- AlterTable
ALTER TABLE "lesson_plans" ADD COLUMN     "curriculumAlignment" JSONB,
ADD COLUMN     "healthScore" DOUBLE PRECISION,
ADD COLUMN     "healthScoreDetails" JSONB,
ADD COLUMN     "language" TEXT DEFAULT 'en';

-- CreateIndex
CREATE INDEX "lesson_plans_subject_idx" ON "lesson_plans"("subject");

-- CreateIndex
CREATE INDEX "lesson_plans_grade_idx" ON "lesson_plans"("grade");

-- CreateIndex
CREATE INDEX "lesson_plans_healthScore_idx" ON "lesson_plans"("healthScore");
