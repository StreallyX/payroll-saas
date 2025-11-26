-- AlterTable: Add type column to companies table
ALTER TABLE "companies" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'tenant';

-- AlterTable: Add companyId column to users table
ALTER TABLE "users" ADD COLUMN "companyId" TEXT;

-- CreateIndex: Add index on companies.type for filtering
CREATE INDEX "companies_type_idx" ON "companies"("type");

-- CreateIndex: Add index on users.companyId for filtering
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- AddForeignKey: Add foreign key constraint for users.companyId
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comments for clarity
COMMENT ON COLUMN "companies"."type" IS 'Type of company: tenant (client company) or agency (service provider company)';
COMMENT ON COLUMN "users"."companyId" IS 'Direct relation to company for inheriting bank accounts and organizational structure';
