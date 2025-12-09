-- CreateTable
CREATE TABLE "timesheet_documents" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'expense',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheet_documents_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "timesheets" ADD COLUMN "totalExpenses" DECIMAL(10,2) DEFAULT 0;

-- CreateIndex
CREATE INDEX "timesheet_documents_timesheetId_idx" ON "timesheet_documents"("timesheetId");

-- AddForeignKey
ALTER TABLE "timesheet_documents" ADD CONSTRAINT "timesheet_documents_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
