-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdBy" TEXT;

-- CreateIndex
CREATE INDEX "users_createdBy_idx" ON "users"("createdBy");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
