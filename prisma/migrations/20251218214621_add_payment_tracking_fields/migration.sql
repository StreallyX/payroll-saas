-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "amountPaidByAgency" DECIMAL(10,2),
ADD COLUMN     "amountReceived" DECIMAL(10,2);
