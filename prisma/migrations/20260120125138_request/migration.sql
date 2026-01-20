-- AlterTable
ALTER TABLE "feature_requests" ADD COLUMN     "revisionFeedback" TEXT,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "userRole" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
