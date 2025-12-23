-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "currencyId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_currencyId_idx" ON "invoices"("currencyId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
