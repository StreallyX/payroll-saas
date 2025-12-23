-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "branchCode" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "routingNumber" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "parentInvoiceId" TEXT;

-- CreateIndex
CREATE INDEX "banks_userId_idx" ON "banks"("userId");

-- CreateIndex
CREATE INDEX "banks_isPrimary_idx" ON "banks"("isPrimary");

-- CreateIndex
CREATE INDEX "invoices_parentInvoiceId_idx" ON "invoices"("parentInvoiceId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parentInvoiceId_fkey" FOREIGN KEY ("parentInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
