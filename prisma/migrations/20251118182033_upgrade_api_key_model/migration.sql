/*
  Warnings:

  - You are about to drop the column `prefix` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `api_keys` table. All the data in the column will be lost.
  - The `permissions` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdById` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyPrefix` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_userId_fkey";

-- DropIndex
DROP INDEX "api_keys_key_idx";

-- DropIndex
DROP INDEX "api_keys_userId_idx";

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "prefix",
DROP COLUMN "userId",
ADD COLUMN     "allowedIPs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "rateLimit" INTEGER,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedById" TEXT,
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "permissions",
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

-- CreateIndex
CREATE INDEX "api_keys_createdById_idx" ON "api_keys"("createdById");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
