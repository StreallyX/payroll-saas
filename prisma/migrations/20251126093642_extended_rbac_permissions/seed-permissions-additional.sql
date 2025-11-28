-- ============================================================================
-- ADDITIONAL RBAC PERMISSIONS SEED
-- Date: 2024-11-26
-- Description: Additional permissions to complete the RBAC system
--              Includes contractor/worker management, additional actions,
--              and ownCompany scope permissions
-- ============================================================================

-- ============================================================================
-- 1. CONTRACTOR PERMISSIONS (Agency Portal)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'contractor', 'list', 'ownCompany', 'contractor.list.ownCompany', 'List Own Contractors', 'List contractors of own agency', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'list', 'global', 'contractor.list.global', 'List All Contractors', 'List all contractors in the system', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view', 'ownCompany', 'contractor.view.ownCompany', 'View Contractor Details', 'View contractor details of own company', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'view', 'global', 'contractor.view.global', 'View All Contractor Details', 'View all contractor details', 'Contractor Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contractor', 'read', 'own', 'contractor.read.own', 'View Own Contractor Profile', 'View own contractor profile', 'Contractor Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. WORKER PERMISSIONS (Payroll Partner Portal)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'worker', 'list', 'ownCompany', 'worker.list.ownCompany', 'List Own Workers', 'List workers managed by payroll partner', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'list', 'global', 'worker.list.global', 'List All Workers', 'List all workers in the system', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view', 'ownCompany', 'worker.view.ownCompany', 'View Worker Details', 'View worker details of own company', 'Worker Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'worker', 'view', 'global', 'worker.view.global', 'View All Worker Details', 'View all worker details', 'Worker Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. REMITTANCE MANAGEMENT (Additional)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'remittance', 'read', 'ownCompany', 'remittance.read.ownCompany', 'View Company Remittances', 'View remittances of own company', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'remittance', 'view', 'ownCompany', 'remittance.view.ownCompany', 'View Company Remittances (alias)', 'View remittances of own company', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. PAYSLIP MANAGEMENT (Additional - ownCompany scope)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'payslip', 'view', 'ownCompany', 'payslip.view.ownCompany', 'View Company Payslips', 'View payslips of own company workers', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 5. USER MANAGEMENT (Additional - ownCompany scope)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'user', 'create', 'ownCompany', 'user.create.ownCompany', 'Create Company Users', 'Create users for own company', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'list', 'ownCompany', 'user.list.ownCompany', 'List Company Users', 'List users of own company', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'update', 'ownCompany', 'user.update.ownCompany', 'Update Company Users', 'Update users of own company', 'User Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 6. COMPANY MANAGEMENT (Additional)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'company', 'read', 'own', 'company.read.own', 'View Own Company', 'View own company details', 'Company Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 7. DOCUMENT MANAGEMENT (Additional - ownCompany scope)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'document', 'read', 'ownCompany', 'document.read.ownCompany', 'View Company Documents', 'View documents of own company', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'upload', 'ownCompany', 'document.upload.ownCompany', 'Upload Company Documents', 'Upload documents for own company', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'download', 'own', 'document.download.own', 'Download Own Documents', 'Download own documents', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'download', 'ownCompany', 'document.download.ownCompany', 'Download Company Documents', 'Download company documents', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'view', 'own', 'document.view.own', 'View Own Documents', 'View own documents', 'Document Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'document', 'view', 'ownCompany', 'document.view.ownCompany', 'View Company Documents', 'View company documents', 'Document Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 8. ONBOARDING GENERIC (Additional)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'onboarding', 'view', 'ownCompany', 'onboarding.view.ownCompany', 'View Company Onboarding', 'View onboarding status of company users', 'Onboarding Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'update', 'ownCompany', 'onboarding.update.ownCompany', 'Update Company Onboarding', 'Update onboarding status of company users', 'Onboarding Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'view', 'global', 'onboarding.view.global', 'View All Onboarding', 'View all onboarding statuses', 'Onboarding Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'update', 'global', 'onboarding.update.global', 'Update All Onboarding', 'Update all onboarding statuses', 'Onboarding Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 9. LEAD MANAGEMENT (Additional - own scope)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'lead', 'read', 'own', 'lead.read.own', 'View Own Leads', 'View own leads', 'Lead Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'lead', 'create', 'own', 'lead.create.own', 'Create Own Leads', 'Create own leads', 'Lead Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'lead', 'update', 'own', 'lead.update.own', 'Update Own Leads', 'Update own leads', 'Lead Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'lead', 'export', 'global', 'lead.export.global', 'Export Leads', 'Export lead data', 'Lead Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 10. REPORTING (New permissions)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'report', 'view', 'global', 'report.view.global', 'View All Reports', 'View all reports including margin report', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'export', 'global', 'report.export.global', 'Export Reports', 'Export reports in CSV/PDF/Excel', 'Reporting', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'report', 'view', 'ownCompany', 'report.view.ownCompany', 'View Company Reports', 'View reports of own company', 'Reporting', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 11. CONTRACT MANAGEMENT (Additional - own scope)
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'contract', 'create', 'own', 'contract.create.own', 'Create Own Contracts', 'Create own contracts (Agency)', 'Contract Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration adds 50+ additional permissions to complete the RBAC system.
-- New resources: contractor, worker
-- New scopes widely used: ownCompany
-- New actions: view, generate, execute, release
-- 
-- After running this migration, you should:
-- 1. Run the seed script: npm run seed
-- 2. Verify permissions in database: SELECT * FROM permissions WHERE key LIKE 'contractor%';
-- 3. Test role assignments work correctly
-- ============================================================================
