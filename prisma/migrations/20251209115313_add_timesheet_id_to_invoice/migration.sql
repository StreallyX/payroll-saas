-- AlterTable: Add timesheetId to Invoice for traceability
ALTER TABLE "invoices" ADD COLUMN "timesheetId" TEXT;

-- CreateIndex: Add index on timesheetId for performance
CREATE INDEX "invoices_timesheetId_idx" ON "invoices"("timesheetId");

-- AddForeignKey: Link Invoice to Timesheet
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "timesheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
