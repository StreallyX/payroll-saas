/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `agencies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "agencies_userId_key" ON "agencies"("userId");

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
