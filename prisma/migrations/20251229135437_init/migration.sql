-- CreateEnum
CREATE TYPE "PostSource" AS ENUM ('GITHUB', 'JOURNAL');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "source" "PostSource" NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_hash_key" ON "Post"("hash");

-- CreateIndex
CREATE INDEX "Post_hash_idx" ON "Post"("hash");

-- CreateIndex
CREATE INDEX "Post_posted_createdAt_idx" ON "Post"("posted", "createdAt");

-- CreateIndex
CREATE INDEX "Post_source_createdAt_idx" ON "Post"("source", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_processed_createdAt_idx" ON "JournalEntry"("processed", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostingStats_date_key" ON "PostingStats"("date");

-- CreateIndex
CREATE INDEX "PostingStats_date_idx" ON "PostingStats"("date");
