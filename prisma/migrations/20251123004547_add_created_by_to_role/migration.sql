-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "createdBy" TEXT;

-- CreateIndex
CREATE INDEX "roles_createdBy_idx" ON "roles"("createdBy");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
