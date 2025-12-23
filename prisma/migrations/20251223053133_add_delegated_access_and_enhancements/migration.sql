-- AlterEnum
ALTER TYPE "MarginType" ADD VALUE 'PERCENTAGE';

-- AlterTable
ALTER TABLE "onboarding_questions" ADD COLUMN     "optionalForCountries" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "delegated_access" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grantedToUserId" TEXT NOT NULL,
    "grantedForUserId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "delegated_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegated_access_tenantId_idx" ON "delegated_access"("tenantId");

-- CreateIndex
CREATE INDEX "delegated_access_grantedToUserId_idx" ON "delegated_access"("grantedToUserId");

-- CreateIndex
CREATE INDEX "delegated_access_grantedForUserId_idx" ON "delegated_access"("grantedForUserId");

-- CreateIndex
CREATE INDEX "delegated_access_grantedBy_idx" ON "delegated_access"("grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "delegated_access_grantedToUserId_grantedForUserId_key" ON "delegated_access"("grantedToUserId", "grantedForUserId");

-- AddForeignKey
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_grantedToUserId_fkey" FOREIGN KEY ("grantedToUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_grantedForUserId_fkey" FOREIGN KEY ("grantedForUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
