-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "timesheetId" TEXT,
ADD COLUMN "documentId" TEXT;

-- CreateIndex
CREATE INDEX "expenses_timesheetId_idx" ON "expenses"("timesheetId");

-- CreateIndex
CREATE INDEX "expenses_documentId_idx" ON "expenses"("documentId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
