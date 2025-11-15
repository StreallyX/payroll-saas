/*
  Warnings:

  - You are about to drop the column `userId` on the `agencies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "agencies" DROP CONSTRAINT "agencies_userId_fkey";

-- DropIndex
DROP INDEX "agencies_userId_key";

-- DropIndex
DROP INDEX "audit_logs_action_idx";

-- DropIndex
DROP INDEX "audit_logs_createdAt_idx";

-- DropIndex
DROP INDEX "audit_logs_entityType_idx";

-- DropIndex
DROP INDEX "audit_logs_tenantId_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_idx";

-- DropIndex
DROP INDEX "onboarding_questions_onboardingTemplateId_idx";

-- DropIndex
DROP INDEX "onboarding_responses_contractorId_idx";

-- DropIndex
DROP INDEX "onboarding_responses_questionId_idx";

-- DropIndex
DROP INDEX "onboarding_responses_status_idx";

-- DropIndex
DROP INDEX "onboarding_templates_tenantId_idx";

-- DropIndex
DROP INDEX "payslips_contractId_idx";

-- DropIndex
DROP INDEX "payslips_contractorId_idx";

-- DropIndex
DROP INDEX "payslips_status_idx";

-- DropIndex
DROP INDEX "payslips_tenantId_idx";

-- DropIndex
DROP INDEX "payslips_year_month_idx";

-- DropIndex
DROP INDEX "tasks_assignedBy_idx";

-- DropIndex
DROP INDEX "tasks_assignedTo_idx";

-- DropIndex
DROP INDEX "tasks_status_idx";

-- DropIndex
DROP INDEX "tasks_tenantId_idx";

-- AlterTable
ALTER TABLE "agencies" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "payrollPartnerId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_payrollPartnerId_fkey" FOREIGN KEY ("payrollPartnerId") REFERENCES "payroll_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
