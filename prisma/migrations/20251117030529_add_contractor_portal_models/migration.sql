-- CreateTable
CREATE TABLE "remittances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "contractId" TEXT,
    "remitNumber" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossPay" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "referredName" TEXT,
    "status" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedUpAt" TIMESTAMP(3),
    "hiredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "referredContractorId" TEXT,
    "rewardAmount" DECIMAL(10,2),
    "rewardCurrency" TEXT DEFAULT 'USD',
    "rewardStatus" TEXT DEFAULT 'pending',
    "rewardPaidAt" TIMESTAMP(3),
    "personalMessage" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "remittances_remitNumber_key" ON "remittances"("remitNumber");

-- CreateIndex
CREATE INDEX "remittances_tenantId_idx" ON "remittances"("tenantId");

-- CreateIndex
CREATE INDEX "remittances_contractorId_idx" ON "remittances"("contractorId");

-- CreateIndex
CREATE INDEX "remittances_contractId_idx" ON "remittances"("contractId");

-- CreateIndex
CREATE INDEX "remittances_status_idx" ON "remittances"("status");

-- CreateIndex
CREATE INDEX "remittances_paymentDate_idx" ON "remittances"("paymentDate");

-- CreateIndex
CREATE INDEX "remittances_periodStart_periodEnd_idx" ON "remittances"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_key" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_tenantId_idx" ON "referrals"("tenantId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_referredContractorId_idx" ON "referrals"("referredContractorId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "referrals_rewardStatus_idx" ON "referrals"("rewardStatus");

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredContractorId_fkey" FOREIGN KEY ("referredContractorId") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
