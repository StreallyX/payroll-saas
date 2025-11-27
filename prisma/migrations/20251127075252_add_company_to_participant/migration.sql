/*
  Warnings:

  - You are about to drop the column `companyId` on the `contracts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractId,role,userId,companyId]` on the table `contract_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_companyId_fkey";

-- DropIndex
DROP INDEX "contract_participants_contractId_userId_role_key";

-- DropIndex
DROP INDEX "contracts_companyId_idx";

-- AlterTable
ALTER TABLE "contract_participants" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "companyId";

-- CreateIndex
CREATE INDEX "contract_participants_companyId_idx" ON "contract_participants"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_participants_contractId_role_userId_companyId_key" ON "contract_participants"("contractId", "role", "userId", "companyId");

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
