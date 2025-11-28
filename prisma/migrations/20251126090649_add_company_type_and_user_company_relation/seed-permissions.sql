-- Seed permissions for multi-tenant, multi-company architecture
-- This script adds the necessary permissions for company and bank account management

-- Company permissions (pour les Agency Admin)
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'company', 'create', 'own', 'company.create.own', 'Create Own Company', 'Create own agency company', 'Company Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'company', 'update', 'own', 'company.update.own', 'Update Own Company', 'Update own agency company', 'Company Management', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'company', 'read', 'own', 'company.read.own', 'View Own Company', 'View own agency company', 'Company Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Bank Account permissions (pour les Agency Admin)
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'bankAccount', 'create', 'own', 'bankAccount.create.own', 'Create Own Bank Account', 'Create bank account for own company', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'bankAccount', 'update', 'own', 'bankAccount.update.own', 'Update Own Bank Account', 'Update bank account for own company', 'Financial', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'bankAccount', 'read', 'own', 'bankAccount.read.own', 'View Own Bank Account', 'View bank account for own company', 'Financial', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Contract approver permissions (pour les Platform Admin)
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'contract', 'approve', 'global', 'contract.approve.global', 'Approve Contracts Globally', 'Approve any contract (MSA/SOW) in the system', 'Contract Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- User visibility permissions (pour les Agency Admin - ownCompany scope)
INSERT INTO "permissions" (id, resource, action, scope, key, "displayName", description, category, "isActive", "isSystem", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'user', 'list', 'ownCompany', 'user.list.ownCompany', 'List Company Users', 'List all users in own company', 'User Management', true, true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE "permissions" IS 'RBAC permissions with resource.action.scope structure';
