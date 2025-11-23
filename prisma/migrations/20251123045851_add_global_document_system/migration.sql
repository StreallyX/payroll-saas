/*
  Warnings:

  - You are about to drop the column `signedContractPath` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the `contract_documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "contract_documents" DROP CONSTRAINT "contract_documents_contractId_fkey";

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "signedContractPath";

-- DropTable
DROP TABLE "contract_documents";
