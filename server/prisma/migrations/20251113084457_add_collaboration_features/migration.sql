-- CreateTable
CREATE TABLE "collaboration_permissions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "collaboration_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_sessions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cursorPosition" JSONB,
    "selectionStart" INTEGER,
    "selectionEnd" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_comments" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "position" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collaboration_permissions_planId_idx" ON "collaboration_permissions"("planId");

-- CreateIndex
CREATE INDEX "collaboration_permissions_userId_idx" ON "collaboration_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_permissions_planId_userId_key" ON "collaboration_permissions"("planId", "userId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_planId_idx" ON "collaboration_sessions"("planId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_userId_idx" ON "collaboration_sessions"("userId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_status_idx" ON "collaboration_sessions"("status");

-- CreateIndex
CREATE INDEX "collaboration_comments_planId_idx" ON "collaboration_comments"("planId");

-- CreateIndex
CREATE INDEX "collaboration_comments_userId_idx" ON "collaboration_comments"("userId");

-- CreateIndex
CREATE INDEX "collaboration_comments_resolved_idx" ON "collaboration_comments"("resolved");

-- AddForeignKey
ALTER TABLE "collaboration_permissions" ADD CONSTRAINT "collaboration_permissions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_permissions" ADD CONSTRAINT "collaboration_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_permissions" ADD CONSTRAINT "collaboration_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_comments" ADD CONSTRAINT "collaboration_comments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_comments" ADD CONSTRAINT "collaboration_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
