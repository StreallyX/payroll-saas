
/**
 * Role Templates System
 * Provides predefined role templates for common scenarios
 */

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  homePath: string;
  permissionGroupIds: string[];
  permissions: string[];
  isCustom: boolean;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  // ========== ADMIN ROLES ==========
  {
    id: 'tenant-admin',
    name: 'Tenant Administrator',
    description: 'Full access to all tenant features and data',
    homePath: '/admin/dashboard',
    permissionGroupIds: [
      'tenant-manage',
      'tenant-users',
      'tenant-roles',
      'companies-full',
      'agencies-full',
      'contractors-full',
      'contracts-full',
      'invoices-full',
      'payroll-full',
      'tasks-full',
      'leads-full',
      'settings-write',
      'audit-logs',
      'onboarding-templates',
      'onboarding-responses',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'super-admin',
    name: 'Super Administrator',
    description: 'Complete platform access including SuperAdmin features',
    homePath: '/superadmin/dashboard',
    permissionGroupIds: ['tenant-manage', 'tenant-users', 'tenant-roles'],
    permissions: [
      'superadmin.tenants.create',
      'superadmin.tenants.suspend',
      'superadmin.tenants.delete',
      'superadmin.users.create',
      'superadmin.users.update',
      'superadmin.users.delete',
    ],
    isCustom: false,
  },

  // ========== MANAGEMENT ROLES ==========
  {
    id: 'operations-manager',
    name: 'Operations Manager',
    description: 'Manage day-to-day operations including contractors, contracts, and payroll',
    homePath: '/admin/dashboard',
    permissionGroupIds: [
      'companies-read',
      'agencies-write',
      'contractors-full',
      'contracts-full',
      'invoices-full',
      'payroll-full',
      'tasks-full',
      'onboarding-templates',
      'onboarding-responses',
      'settings-read',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'hr-manager',
    name: 'HR Manager',
    description: 'Manage contractors, onboarding, and HR-related tasks',
    homePath: '/admin/contractors',
    permissionGroupIds: [
      'contractors-full',
      'contracts-read',
      'onboarding-templates',
      'onboarding-responses',
      'tasks-full',
      'settings-read',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'finance-manager',
    name: 'Finance Manager',
    description: 'Manage invoices, payroll, and financial operations',
    homePath: '/admin/invoices',
    permissionGroupIds: [
      'contractors-read',
      'contracts-read',
      'invoices-full',
      'payroll-full',
      'settings-read',
    ],
    permissions: ['banks.view', 'banks.create', 'banks.update', 'banks.delete'],
    isCustom: false,
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    description: 'Manage leads, companies, and sales operations',
    homePath: '/admin/leads',
    permissionGroupIds: [
      'companies-full',
      'agencies-read',
      'contractors-read',
      'leads-full',
      'tasks-full',
    ],
    permissions: [],
    isCustom: false,
  },

  // ========== SPECIALIST ROLES ==========
  {
    id: 'recruiter',
    name: 'Recruiter',
    description: 'Manage contractor onboarding and recruitment',
    homePath: '/admin/contractors',
    permissionGroupIds: [
      'contractors-write',
      'contractors-onboarding',
      'leads-full',
      'tasks-basic',
      'onboarding-responses',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'payroll-specialist',
    name: 'Payroll Specialist',
    description: 'Process payroll and manage payslips',
    homePath: '/admin/payroll',
    permissionGroupIds: [
      'contractors-read',
      'contracts-read',
      'invoices-read',
      'payroll-process',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'account-manager',
    name: 'Account Manager',
    description: 'Manage client accounts and relationships',
    homePath: '/admin/companies',
    permissionGroupIds: [
      'companies-write',
      'agencies-write',
      'contractors-read',
      'contracts-write',
      'invoices-write',
      'tasks-full',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'contract-specialist',
    name: 'Contract Specialist',
    description: 'Manage contracts and approvals',
    homePath: '/admin/contracts',
    permissionGroupIds: [
      'contractors-read',
      'contracts-write',
      'contracts-approve',
      'tasks-basic',
    ],
    permissions: [],
    isCustom: false,
  },

  // ========== LIMITED ACCESS ROLES ==========
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to most data',
    homePath: '/admin/dashboard',
    permissionGroupIds: [
      'companies-read',
      'agencies-read',
      'contractors-read',
      'contracts-read',
      'invoices-read',
      'payroll-read',
      'tasks-basic',
      'settings-read',
    ],
    permissions: [],
    isCustom: false,
  },
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'Read-only access for auditing purposes',
    homePath: '/admin/audit-logs',
    permissionGroupIds: [
      'companies-read',
      'contractors-read',
      'contracts-read',
      'invoices-read',
      'payroll-read',
      'audit-logs',
      'settings-read',
    ],
    permissions: [],
    isCustom: false,
  },

  // ========== AGENCY ROLES ==========
  {
    id: 'agency-admin',
    name: 'Agency Administrator',
    description: 'Manage agency operations and contractors',
    homePath: '/admin/dashboard',
    permissionGroupIds: [
      'contractors-full',
      'contracts-read',
      'invoices-read',
      'payroll-read',
      'tasks-full',
      'onboarding-responses',
    ],
    permissions: ['agencies.manage_team'],
    isCustom: false,
  },
  {
    id: 'agency-coordinator',
    name: 'Agency Coordinator',
    description: 'Coordinate contractor assignments and tasks',
    homePath: '/admin/contractors',
    permissionGroupIds: [
      'contractors-write',
      'contractors-onboarding',
      'tasks-full',
    ],
    permissions: ['agencies.assign_contractor'],
    isCustom: false,
  },

  // ========== CONTRACTOR ROLE ==========
  {
    id: 'contractor',
    name: 'Contractor',
    description: 'Self-service portal for contractors',
    homePath: '/contractor/dashboard',
    permissionGroupIds: [],
    permissions: [
      'contractors.view',
      'contractors.documents.view',
      'contractors.documents.upload',
      'contracts.view',
      'contracts.download_pdf',
      'invoices.view',
      'payslip.view',
      'onboarding.responses.view_own',
      'onboarding.responses.submit',
      'tasks.view',
    ],
    isCustom: false,
  },
];

/**
 * Get all role templates
 */
export function getAllRoleTemplates(): RoleTemplate[] {
  return ROLE_TEMPLATES;
}

/**
 * Get role template by ID
 */
export function getRoleTemplateById(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get permissions for a role template (combining groups and individual permissions)
 */
export function getRoleTemplatePermissions(templateId: string): string[] {
  const template = getRoleTemplateById(templateId);
  if (!template) return [];

  const permissions = new Set<string>(template.permissions);

  // Import permission groups
  const { getPermissionsFromGroups } = require('./permissionGroups');
  const groupPermissions = getPermissionsFromGroups(template.permissionGroupIds);
  groupPermissions.forEach((perm) => permissions.add(perm));

  return Array.from(permissions);
}

/**
 * Create a custom role template
 */
export function createCustomRoleTemplate(
  name: string,
  description: string,
  permissions: string[],
  homePath: string = '/admin/dashboard'
): RoleTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    homePath,
    permissionGroupIds: [],
    permissions,
    isCustom: true,
  };
}
