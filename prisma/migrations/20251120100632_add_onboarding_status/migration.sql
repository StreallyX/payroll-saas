/*
  Warnings:

  - You are about to drop the column `approverType` on the `approval_steps` table. All the data in the column will be lost.
  - You are about to drop the column `agencyId` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `agencySignDate` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `contractorSignDate` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `payrollPartnerId` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `onboarding_responses` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `ownerType` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `payslips` table. All the data in the column will be lost.
  - You are about to drop the column `referredContractorId` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `referrerContractorId` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `agencyId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `payrollPartnerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `agencies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contractors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_partners` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,questionId]` on the table `onboarding_responses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `onboarding_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `onboarding_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `payslips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerUserId` to the `referrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `remittances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedBy` to the `timesheets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "agencies" DROP CONSTRAINT "agencies_countryId_fkey";

-- DropForeignKey
ALTER TABLE "agencies" DROP CONSTRAINT "agencies_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "contractors" DROP CONSTRAINT "contractors_agencyId_fkey";

-- DropForeignKey
ALTER TABLE "contractors" DROP CONSTRAINT "contractors_countryId_fkey";

-- DropForeignKey
ALTER TABLE "contractors" DROP CONSTRAINT "contractors_onboardingTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "contractors" DROP CONSTRAINT "contractors_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "contractors" DROP CONSTRAINT "contractors_userId_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_agencyId_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_payrollPartnerId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_contractId_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_responses" DROP CONSTRAINT "onboarding_responses_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_partners" DROP CONSTRAINT "payroll_partners_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referredContractorId_fkey";

-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referrerContractorId_fkey";

-- DropForeignKey
ALTER TABLE "remittances" DROP CONSTRAINT "remittances_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_agencyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_payrollPartnerId_fkey";

-- DropIndex
DROP INDEX "contracts_agencyId_idx";

-- DropIndex
DROP INDEX "contracts_contractorId_idx";

-- DropIndex
DROP INDEX "contracts_payrollPartnerId_idx";

-- DropIndex
DROP INDEX "expenses_approvedBy_idx";

-- DropIndex
DROP INDEX "expenses_contractorId_idx";

-- DropIndex
DROP INDEX "onboarding_responses_contractorId_questionId_key";

-- DropIndex
DROP INDEX "payment_methods_ownerId_ownerType_idx";

-- DropIndex
DROP INDEX "payslips_contractorId_idx";

-- DropIndex
DROP INDEX "referrals_referredContractorId_idx";

-- DropIndex
DROP INDEX "referrals_referrerContractorId_idx";

-- DropIndex
DROP INDEX "remittances_contractorId_idx";

-- DropIndex
DROP INDEX "timesheets_approvedBy_idx";

-- DropIndex
DROP INDEX "timesheets_contractorId_idx";

-- AlterTable
ALTER TABLE "approval_steps" DROP COLUMN "approverType",
ADD COLUMN     "comments" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "approval_workflows" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "agencyId",
DROP COLUMN "agencySignDate",
DROP COLUMN "contractorId",
DROP COLUMN "contractorSignDate",
DROP COLUMN "payrollPartnerId",
ADD COLUMN     "signedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "contractorId",
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "contractId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "onboarding_responses" DROP COLUMN "contractorId",
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "ownerId",
DROP COLUMN "ownerType",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payslips" DROP COLUMN "contractorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "referrals" DROP COLUMN "referredContractorId",
DROP COLUMN "referrerContractorId",
ADD COLUMN     "referredUserId" TEXT,
ADD COLUMN     "referrerUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "remittances" DROP COLUMN "contractorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "headerBgColor" SET DEFAULT '#ffff',
ALTER COLUMN "sidebarBgColor" SET DEFAULT '#ffff';

-- AlterTable
ALTER TABLE "timesheets" DROP COLUMN "contractorId",
ADD COLUMN     "submittedBy" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "agencyId",
DROP COLUMN "companyId",
DROP COLUMN "payrollPartnerId",
ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "alternateInvoicingEmail" TEXT,
ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "countryId" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "invoicingContactEmail" TEXT,
ADD COLUMN     "invoicingContactName" TEXT,
ADD COLUMN     "invoicingContactPhone" TEXT,
ADD COLUMN     "officeBuilding" TEXT,
ADD COLUMN     "onboardingStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "onboardingTemplateId" TEXT,
ADD COLUMN     "postCode" TEXT,
ADD COLUMN     "profileData" JSONB,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "vatNumber" TEXT,
ADD COLUMN     "website" TEXT;

-- DropTable
DROP TABLE "agencies";

-- DropTable
DROP TABLE "contractors";

-- DropTable
DROP TABLE "payroll_partners";

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_participants" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_users_companyId_idx" ON "company_users"("companyId");

-- CreateIndex
CREATE INDEX "company_users_userId_idx" ON "company_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_companyId_userId_key" ON "company_users"("companyId", "userId");

-- CreateIndex
CREATE INDEX "contract_participants_contractId_idx" ON "contract_participants"("contractId");

-- CreateIndex
CREATE INDEX "contract_participants_userId_idx" ON "contract_participants"("userId");

-- CreateIndex
CREATE INDEX "contract_participants_role_idx" ON "contract_participants"("role");

-- CreateIndex
CREATE UNIQUE INDEX "contract_participants_contractId_userId_role_key" ON "contract_participants"("contractId", "userId", "role");

-- CreateIndex
CREATE INDEX "expenses_contractId_idx" ON "expenses"("contractId");

-- CreateIndex
CREATE INDEX "onboarding_responses_tenantId_idx" ON "onboarding_responses"("tenantId");

-- CreateIndex
CREATE INDEX "onboarding_responses_userId_idx" ON "onboarding_responses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_responses_userId_questionId_key" ON "onboarding_responses"("userId", "questionId");

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");

-- CreateIndex
CREATE INDEX "payslips_userId_idx" ON "payslips"("userId");

-- CreateIndex
CREATE INDEX "referrals_referrerUserId_idx" ON "referrals"("referrerUserId");

-- CreateIndex
CREATE INDEX "referrals_referredUserId_idx" ON "referrals"("referredUserId");

-- CreateIndex
CREATE INDEX "remittances_userId_idx" ON "remittances"("userId");

-- CreateIndex
CREATE INDEX "timesheets_submittedBy_idx" ON "timesheets"("submittedBy");

-- CreateIndex
CREATE INDEX "timesheets_contractId_idx" ON "timesheets"("contractId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_onboardingTemplateId_fkey" FOREIGN KEY ("onboardingTemplateId") REFERENCES "onboarding_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_responses" ADD CONSTRAINT "onboarding_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_responses" ADD CONSTRAINT "onboarding_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
