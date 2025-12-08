-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "adminModificationNote" TEXT,
ADD COLUMN     "adminModifiedAmount" DECIMAL(10,2),
ADD COLUMN     "approvalWorkflowId" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "baseAmount" DECIMAL(10,2),
ADD COLUMN     "changesRequested" TEXT,
ADD COLUMN     "marginAmount" DECIMAL(10,2),
ADD COLUMN     "marginPaidBy" TEXT,
ADD COLUMN     "marginPercentage" DECIMAL(5,2),
ADD COLUMN     "modifiedBy" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "workflowState" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "amountReceived" DECIMAL(12,2),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedBy" TEXT,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "receivedBy" TEXT,
ADD COLUMN     "workflowState" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "sentBy" TEXT,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" TEXT,
ADD COLUMN     "workflowState" TEXT NOT NULL DEFAULT 'generated';

-- AlterTable
ALTER TABLE "remittances" ADD COLUMN     "sentBy" TEXT,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" TEXT,
ADD COLUMN     "workflowState" TEXT NOT NULL DEFAULT 'generated';

-- AlterTable
ALTER TABLE "timesheets" ADD COLUMN     "adminModificationNote" TEXT,
ADD COLUMN     "adminModifiedAmount" DECIMAL(10,2),
ADD COLUMN     "changesRequested" TEXT,
ADD COLUMN     "modifiedBy" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "workflowState" TEXT NOT NULL DEFAULT 'draft';

-- CreateTable
CREATE TABLE "entity_state_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesheetId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "payslipId" TEXT,
    "remittanceId" TEXT,

    CONSTRAINT "entity_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "states" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "permissions" JSONB NOT NULL,
    "autoActions" JSONB,
    "validationRules" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_workflow_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "timesheetWorkflowTemplateId" TEXT,
    "invoiceWorkflowTemplateId" TEXT,
    "paymentWorkflowTemplateId" TEXT,
    "payslipWorkflowTemplateId" TEXT,
    "remittanceWorkflowTemplateId" TEXT,
    "requireApprovalForTimesheets" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalForInvoices" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalForPayments" BOOLEAN NOT NULL DEFAULT true,
    "autoSendInvoiceOnApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoCreatePayslipOnInvoice" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnStateChange" BOOLEAN NOT NULL DEFAULT true,
    "defaultMarginPaidBy" TEXT,
    "allowMarginOverride" BOOLEAN NOT NULL DEFAULT true,
    "requireMarginApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowAdminModifyAmounts" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalAfterModify" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_workflow_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_workflow_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultPaymentMode" TEXT DEFAULT 'gross',
    "enableTimesheetWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "enableInvoiceWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "enablePaymentWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_workflow_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entity_state_history_tenantId_idx" ON "entity_state_history"("tenantId");

-- CreateIndex
CREATE INDEX "entity_state_history_entityType_entityId_idx" ON "entity_state_history"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "entity_state_history_actorId_idx" ON "entity_state_history"("actorId");

-- CreateIndex
CREATE INDEX "entity_state_history_transitionedAt_idx" ON "entity_state_history"("transitionedAt");

-- CreateIndex
CREATE INDEX "entity_state_history_timesheetId_idx" ON "entity_state_history"("timesheetId");

-- CreateIndex
CREATE INDEX "entity_state_history_invoiceId_idx" ON "entity_state_history"("invoiceId");

-- CreateIndex
CREATE INDEX "entity_state_history_paymentId_idx" ON "entity_state_history"("paymentId");

-- CreateIndex
CREATE INDEX "entity_state_history_payslipId_idx" ON "entity_state_history"("payslipId");

-- CreateIndex
CREATE INDEX "entity_state_history_remittanceId_idx" ON "entity_state_history"("remittanceId");

-- CreateIndex
CREATE INDEX "workflow_templates_tenantId_idx" ON "workflow_templates"("tenantId");

-- CreateIndex
CREATE INDEX "workflow_templates_entityType_idx" ON "workflow_templates"("entityType");

-- CreateIndex
CREATE INDEX "workflow_templates_isActive_idx" ON "workflow_templates"("isActive");

-- CreateIndex
CREATE INDEX "workflow_templates_isDefault_idx" ON "workflow_templates"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_tenantId_name_entityType_key" ON "workflow_templates"("tenantId", "name", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_workflow_settings_tenantId_key" ON "tenant_workflow_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_workflow_config_tenantId_key" ON "tenant_workflow_config"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_workflowState_idx" ON "invoices"("workflowState");

-- CreateIndex
CREATE INDEX "payments_workflowState_idx" ON "payments"("workflowState");

-- CreateIndex
CREATE INDEX "payslips_workflowState_idx" ON "payslips"("workflowState");

-- CreateIndex
CREATE INDEX "remittances_workflowState_idx" ON "remittances"("workflowState");

-- CreateIndex
CREATE INDEX "timesheets_workflowState_idx" ON "timesheets"("workflowState");

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_state_history" ADD CONSTRAINT "entity_state_history_remittanceId_fkey" FOREIGN KEY ("remittanceId") REFERENCES "remittances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_workflow_settings" ADD CONSTRAINT "tenant_workflow_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_workflow_settings" ADD CONSTRAINT "tenant_workflow_settings_timesheetWorkflowTemplateId_fkey" FOREIGN KEY ("timesheetWorkflowTemplateId") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
