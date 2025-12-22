/*
  Warnings:

  - You are about to drop the column `processedAt` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `sentBy` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `validatedAt` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `validatedBy` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `workflowState` on the `remittances` table. All the data in the column will be lost.
  - The `status` column on the `remittances` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `paymentType` to the `remittances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `remittances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientType` to the `remittances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `remittances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RECEIVED', 'SENT');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('ADMIN', 'CONTRACTOR', 'PAYROLL', 'CLIENT', 'AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "remittances" DROP CONSTRAINT "remittances_userId_fkey";

-- DropIndex
DROP INDEX "remittances_userId_idx";

-- DropIndex
DROP INDEX "remittances_workflowState_idx";

-- AlterTable
ALTER TABLE "remittances" DROP COLUMN "processedAt",
DROP COLUMN "requestedAt",
DROP COLUMN "sentBy",
DROP COLUMN "userId",
DROP COLUMN "validatedAt",
DROP COLUMN "validatedBy",
DROP COLUMN "workflowState",
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL,
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "recipientType" "RecipientType" NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RemittanceStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "remittances_invoiceId_idx" ON "remittances"("invoiceId");

-- CreateIndex
CREATE INDEX "remittances_contractId_idx" ON "remittances"("contractId");

-- CreateIndex
CREATE INDEX "remittances_recipientId_idx" ON "remittances"("recipientId");

-- CreateIndex
CREATE INDEX "remittances_senderId_idx" ON "remittances"("senderId");

-- CreateIndex
CREATE INDEX "remittances_status_idx" ON "remittances"("status");

-- CreateIndex
CREATE INDEX "remittances_paymentType_idx" ON "remittances"("paymentType");

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
