/*
  Warnings:

  - You are about to drop the column `isActive` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `documents` table. All the data in the column will be lost.
  - Added the required column `s3Key` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "isActive",
DROP COLUMN "name",
ADD COLUMN     "fileHash" TEXT,
ADD COLUMN     "s3Key" TEXT NOT NULL,
ALTER COLUMN "fileUrl" DROP NOT NULL;
