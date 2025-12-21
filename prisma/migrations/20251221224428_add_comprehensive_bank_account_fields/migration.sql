-- CreateEnum
CREATE TYPE "BankAccountUsage" AS ENUM ('SALARY', 'GROSS', 'EXPENSES', 'OTHER');

-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "bankAddress" TEXT,
ADD COLUMN     "bankCity" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "intermediarySwiftCode" TEXT,
ADD COLUMN     "postCode" TEXT,
ADD COLUMN     "sortCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "usage" "BankAccountUsage",
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "banks_usage_idx" ON "banks"("usage");
