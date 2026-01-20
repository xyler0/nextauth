/*
  Warnings:

  - You are about to drop the column `githubAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `githubId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `githubUsername` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xAccessSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xApiKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xApiSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xUsername` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_githubId_key";

-- DropIndex
DROP INDEX "User_xId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "githubAccessToken",
DROP COLUMN "githubId",
DROP COLUMN "githubUsername",
DROP COLUMN "password",
DROP COLUMN "xAccessSecret",
DROP COLUMN "xAccessToken",
DROP COLUMN "xApiKey",
DROP COLUMN "xApiSecret",
DROP COLUMN "xId",
DROP COLUMN "xUsername",
ADD COLUMN     "authUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "User_authUserId_idx" ON "User"("authUserId");
