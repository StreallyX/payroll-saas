-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerType" TEXT NOT NULL DEFAULT 'tenant';

-- CreateIndex
CREATE INDEX "companies_bankId_idx" ON "companies"("bankId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
