-- ============================================================================
-- EXTENDED RBAC PERMISSIONS SEED
-- Date: 2024-11-26
-- Description: Complete set of permissions for Agency Portal, Payroll Partner Portal,
--              Reporting System, and enhanced core functionality
-- ============================================================================

-- ============================================================================
-- 1. USER MANAGEMENT - Activation/Deactivation
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'user', 'create', 'global', 'user.create.global', 'Create Any User', 'Create any user (Agency/Contractor/Payroll Partner)', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'activate', 'global', 'user.activate.global', 'Activate User', 'Reactivate an inactive user', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'deactivate', 'global', 'user.deactivate.global', 'Deactivate User', 'Deactivate an active user', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'activate', 'ownCompany', 'user.activate.ownCompany', 'Activate Company User', 'Reactivate an inactive user in own company', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'deactivate', 'ownCompany', 'user.deactivate.ownCompany', 'Deactivate Company User', 'Deactivate an active user in own company', 'User Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. COMPANY MANAGEMENT - Activation/Deactivation
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'company', 'activate', 'global', 'company.activate.global', 'Activate Company', 'Reactivate an inactive company', 'Company Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'company', 'deactivate', 'global', 'company.deactivate.global', 'Deactivate Company', 'Deactivate an active company', 'Company Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. INVOICE MANAGEMENT - Generation & Release
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'invoice', 'generate_from_timesheet', 'global', 'invoice.generate_from_timesheet.global', 'Generate Invoice from Timesheet', 'Convert approved timesheet to invoice', 'Invoice Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'invoice', 'release', 'global', 'invoice.release.global', 'Release Invoice', 'Release invoice to client/agency', 'Invoice Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'invoice', 'upload_to_platform', 'ownCompany', 'invoice.upload_to_platform.ownCompany', 'Upload Invoice to Platform', 'Upload invoice to Aspirock (Payroll Partner)', 'Invoice Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'invoice', 'view', 'ownCompany', 'invoice.view.ownCompany', 'View Company Invoices', 'View invoices of own company contractors', 'Invoice Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. PAYMENT MANAGEMENT - Execution
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'payment', 'create', 'global', 'payment.create.global', 'Create Payment', 'Create a payment record', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payment', 'list', 'global', 'payment.list.global', 'List All Payments', 'List all payments in the system', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payment', 'execute', 'global', 'payment.execute.global', 'Execute Payment', 'Execute payment via bank transfer', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payment', 'approve', 'global', 'payment.approve.global', 'Approve Payment', 'Approve a payment before execution', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payment', 'cancel', 'global', 'payment.cancel.global', 'Cancel Payment', 'Cancel a pending payment', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payment', 'view', 'own', 'payment.view.own', 'View Own Payments', 'View own payment records', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 5. REMITTANCE MANAGEMENT - Generation & Sending
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'remittance', 'generate', 'global', 'remittance.generate.global', 'Generate Remittance', 'Generate remittance advice document', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'remittance', 'send', 'global', 'remittance.send.global', 'Send Remittance', 'Send remittance advice to worker', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'remittance', 'view', 'ownCompany', 'remittance.view.ownCompany', 'View Company Remittances', 'View remittances of own company', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 6. CONTRACTOR PORTAL (Agency) - Visibility & Management
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'contractor', 'list', 'ownCompany', 'contractor.list.ownCompany', 'List Own Contractors', 'List all contractors associated with own agency', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view', 'ownCompany', 'contractor.view.ownCompany', 'View Contractor Details', 'View detailed information of own contractors', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view_onboarding', 'ownCompany', 'contractor.view_onboarding.ownCompany', 'View Contractor Onboarding', 'View onboarding status and progress of contractors', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view_dates', 'ownCompany', 'contractor.view_dates.ownCompany', 'View Contractor Dates', 'View start/end dates and contract periods', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view_payments', 'ownCompany', 'contractor.view_payments.ownCompany', 'View Contractor Payments', 'View payment history and status of contractors', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'list', 'global', 'contractor.list.global', 'List All Contractors', 'List all contractors in the system', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view', 'global', 'contractor.view.global', 'View Any Contractor', 'View any contractor details', 'Contractor Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 7. WORKER MANAGEMENT (Payroll Partner) - Visibility & Management
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'worker', 'list', 'ownCompany', 'worker.list.ownCompany', 'List Own Workers', 'List all workers managed by payroll partner', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view', 'ownCompany', 'worker.view.ownCompany', 'View Worker Details', 'View detailed information of own workers', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view_onboarding', 'ownCompany', 'worker.view_onboarding.ownCompany', 'View Worker Onboarding', 'View onboarding status and progress of workers', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view_dates', 'ownCompany', 'worker.view_dates.ownCompany', 'View Worker Dates', 'View start/end dates and employment periods', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view_contract', 'ownCompany', 'worker.view_contract.ownCompany', 'View Worker Contract', 'View local employment contract of workers', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'list', 'global', 'worker.list.global', 'List All Workers', 'List all workers in the system', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view', 'global', 'worker.view.global', 'View Any Worker', 'View any worker details', 'Worker Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 8. PAYSLIP MANAGEMENT (Payroll Partner) - Upload & Distribution
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'payslip', 'upload', 'ownCompany', 'payslip.upload.ownCompany', 'Upload Payslip', 'Upload payslip for managed worker', 'Payroll Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payslip', 'view', 'ownCompany', 'payslip.view.ownCompany', 'View Company Payslips', 'View payslips of managed workers', 'Payroll Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'payslip', 'generate', 'global', 'payslip.generate.global', 'Generate Payslip', 'Generate payslip from payment data', 'Payroll Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 9. DOCUMENT MANAGEMENT - Granular Upload/View/Download
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'document', 'upload', 'own', 'document.upload.own', 'Upload Own Document', 'Upload document for own use', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'upload', 'ownCompany', 'document.upload.ownCompany', 'Upload Company Document', 'Upload document for own company', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'upload_selfbill', 'own', 'document.upload_selfbill.own', 'Upload Self-Bill', 'Upload self-bill invoice from client', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'upload_proof_of_payment', 'own', 'document.upload_proof_of_payment.own', 'Upload Proof of Payment', 'Upload proof of payment for invoice', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'upload_kyc', 'ownCompany', 'document.upload_kyc.ownCompany', 'Upload KYC Document', 'Upload KYC document (passport, ID) for contractor', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'view', 'own', 'document.view.own', 'View Own Documents', 'View own uploaded documents', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'view', 'ownCompany', 'document.view.ownCompany', 'View Company Documents', 'View documents of own company', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'download', 'own', 'document.download.own', 'Download Own Documents', 'Download own documents', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'download', 'ownCompany', 'document.download.ownCompany', 'Download Company Documents', 'Download documents of own company', 'Document Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 10. REPORTING SYSTEM - Analytics & Insights
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'report', 'view_margin', 'global', 'report.view_margin.global', 'View Margin Report', 'View gross margin and profitability report', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view_live_contractors', 'global', 'report.view_live_contractors.global', 'View Live Contractors', 'View count of active contractors', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view_by_country', 'global', 'report.view_by_country.global', 'View Reports by Country', 'View contracts and income distribution by country', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view_by_client', 'global', 'report.view_by_client.global', 'View Reports by Client', 'View contractor distribution by client/agency', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view_income', 'global', 'report.view_income.global', 'View Income Report', 'View income and revenue reports', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'export', 'global', 'report.export.global', 'Export Reports', 'Export reports to CSV/PDF/Excel', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view', 'ownCompany', 'report.view.ownCompany', 'View Company Reports', 'View reports limited to own company data', 'Reporting', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 11. ONBOARDING MANAGEMENT - Enhanced Visibility
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'onboarding', 'view', 'ownCompany', 'onboarding.view.ownCompany', 'View Company Onboarding', 'View onboarding status of company contractors/workers', 'Onboarding', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'update', 'ownCompany', 'onboarding.update.ownCompany', 'Update Company Onboarding', 'Update onboarding status of company contractors/workers', 'Onboarding', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'view', 'global', 'onboarding.view.global', 'View All Onboarding', 'View all onboarding statuses', 'Onboarding', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'update', 'global', 'onboarding.update.global', 'Update Any Onboarding', 'Update any onboarding status', 'Onboarding', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE "permissions" IS 'RBAC permissions with resource.action.scope structure - Extended for Agency/Payroll Partner portals';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- To verify the new permissions were added:
-- SELECT resource, action, scope, key, category FROM permissions WHERE category IN ('Contractor Management', 'Worker Management', 'Payroll Management', 'Reporting') ORDER BY category, resource, action;
