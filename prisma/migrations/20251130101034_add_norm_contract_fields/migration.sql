-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "contractorSignedAt" TIMESTAMP(3),
ADD COLUMN     "payrollUserId" TEXT,
ADD COLUMN     "userBankIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
