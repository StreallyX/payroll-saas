-- ============================================================================
-- ADDITIONAL "OWN" SCOPE PERMISSIONS
-- Date: 2024-11-26
-- Description: Missing "own" scope permissions needed for CONTRACTOR and WORKER roles
-- ============================================================================

-- ============================================================================
-- USER MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'user', 'read', 'own', 'user.read.own', 'Read Own Profile', 'View own user profile', 'User Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'user', 'update', 'own', 'user.update.own', 'Update Own Profile', 'Update own user profile', 'User Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMPANY MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'company', 'read', 'own', 'company.read.own', 'Read Own Company', 'View own company details', 'Company Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'company', 'update', 'own', 'company.update.own', 'Update Own Company', 'Update own company details', 'Company Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- CONTRACT MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'contract', 'read', 'own', 'contract.read.own', 'Read Own Contracts', 'View own contracts', 'Contract Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contract', 'create', 'own', 'contract.create.own', 'Create Own Contract', 'Create contract for own company', 'Contract Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contract', 'update', 'own', 'contract.update.own', 'Update Own Contract', 'Update own contracts', 'Contract Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'contract', 'sign', 'own', 'contract.sign.own', 'Sign Own Contract', 'Sign own contracts', 'Contract Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- LEAD MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'lead', 'read', 'own', 'lead.read.own', 'Read Own Leads', 'View own assigned leads', 'Lead Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'lead', 'create', 'own', 'lead.create.own', 'Create Own Lead', 'Create new lead', 'Lead Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'lead', 'update', 'own', 'lead.update.own', 'Update Own Lead', 'Update own assigned leads', 'Lead Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- TIMESHEET MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'timesheet', 'read', 'own', 'timesheet.read.own', 'Read Own Timesheets', 'View own timesheets', 'Timesheet Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'timesheet', 'create', 'own', 'timesheet.create.own', 'Create Own Timesheet', 'Create own timesheets', 'Timesheet Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'timesheet', 'update', 'own', 'timesheet.update.own', 'Update Own Timesheet', 'Update own timesheets', 'Timesheet Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'timesheet', 'submit', 'own', 'timesheet.submit.own', 'Submit Own Timesheet', 'Submit own timesheets for approval', 'Timesheet Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- INVOICE MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'invoice', 'read', 'own', 'invoice.read.own', 'Read Own Invoices', 'View own invoices', 'Invoice Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PAYSLIP MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'payslip', 'read', 'own', 'payslip.read.own', 'Read Own Payslips', 'View own payslips', 'Payroll Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- REMITTANCE MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'remittance', 'read', 'own', 'remittance.read.own', 'Read Own Remittances', 'View own remittance advices', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ONBOARDING MANAGEMENT - Own Scope
-- ============================================================================
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'onboarding', 'read', 'own', 'onboarding.read.own', 'Read Own Onboarding', 'View own onboarding status', 'Onboarding', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'onboarding', 'update', 'own', 'onboarding.update.own', 'Update Own Onboarding', 'Update own onboarding responses', 'Onboarding', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- To verify the new "own" scope permissions were added:
-- SELECT resource, action, scope, key, category FROM permissions WHERE scope = 'own' ORDER BY category, resource, action;
