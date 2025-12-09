-- AlterTable
ALTER TABLE "timesheets" ADD COLUMN     "baseAmount" DECIMAL(10,2),
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "marginAmount" DECIMAL(10,2);
