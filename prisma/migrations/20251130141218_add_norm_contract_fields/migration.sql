-- CreateTable
CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_documents_contractId_idx" ON "contract_documents"("contractId");

-- CreateIndex
CREATE INDEX "contract_documents_uploadedByUserId_idx" ON "contract_documents"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "contract_documents_documentId_idx" ON "contract_documents"("documentId");

-- CreateIndex
CREATE INDEX "contract_documents_category_idx" ON "contract_documents"("category");

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
