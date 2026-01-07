-- AlterTable: Change default status for FeatureRequest to PENDING
ALTER TABLE "feature_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable: PageTestStatus for tracking testing progress of platform pages
CREATE TABLE "page_test_status" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageRole" TEXT NOT NULL,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "testedBy" TEXT,
    "testedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_test_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_test_status_tenantId_idx" ON "page_test_status"("tenantId");

-- CreateIndex
CREATE INDEX "page_test_status_pageRole_idx" ON "page_test_status"("pageRole");

-- CreateIndex
CREATE INDEX "page_test_status_isValidated_idx" ON "page_test_status"("isValidated");

-- CreateIndex: Unique constraint for combination of tenantId, pageUrl, and pageRole
CREATE UNIQUE INDEX "page_test_status_tenantId_pageUrl_pageRole_key" ON "page_test_status"("tenantId", "pageUrl", "pageRole");

-- AddForeignKey
ALTER TABLE "page_test_status" ADD CONSTRAINT "page_test_status_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
