-- CreateTable
CREATE TABLE "WritingPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgSentenceLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWordsPerSentence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSentenceLength" INTEGER NOT NULL DEFAULT 0,
    "minSentenceLength" INTEGER NOT NULL DEFAULT 0,
    "commonWords" JSONB NOT NULL,
    "avoidWords" JSONB NOT NULL,
    "technicalTerms" JSONB NOT NULL,
    "usesEmojis" BOOLEAN NOT NULL DEFAULT false,
    "usesHashtags" BOOLEAN NOT NULL DEFAULT false,
    "usesAbbreviations" BOOLEAN NOT NULL DEFAULT false,
    "formalityScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "commaFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dashFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ellipsisFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commonStarters" JSONB NOT NULL,
    "examplePosts" JSONB NOT NULL,
    "totalPostsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WritingPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "editedText" TEXT,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WritingPattern_userId_key" ON "WritingPattern"("userId");

-- CreateIndex
CREATE INDEX "WritingPattern_userId_idx" ON "WritingPattern"("userId");

-- CreateIndex
CREATE INDEX "TrainingFeedback_userId_createdAt_idx" ON "TrainingFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WritingPattern" ADD CONSTRAINT "WritingPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
