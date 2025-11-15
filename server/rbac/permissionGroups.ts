
/**
 * Permission Groups System
 * Organizes permissions into logical groups for easier management
 */

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  category: string;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  // ========== TENANT MANAGEMENT ==========
  {
    id: 'tenant-view',
    name: 'Tenant Viewing',
    description: 'View tenant information and settings',
    category: 'Tenant Management',
    permissions: ['tenant.view', 'tenant.billing.view'],
  },
  {
    id: 'tenant-manage',
    name: 'Tenant Management',
    description: 'Full tenant management capabilities',
    category: 'Tenant Management',
    permissions: [
      'tenant.view',
      'tenant.update',
      'tenant.branding.update',
      'tenant.billing.view',
      'tenant.billing.update',
    ],
  },
  {
    id: 'tenant-users',
    name: 'User Management',
    description: 'Manage users within tenant',
    category: 'Tenant Management',
    permissions: [
      'tenant.users.view',
      'tenant.users.invite',
      'tenant.users.create',
      'tenant.users.update',
      'tenant.users.disable',
    ],
  },
  {
    id: 'tenant-roles',
    name: 'Role Management',
    description: 'Manage roles and permissions',
    category: 'Tenant Management',
    permissions: [
      'tenant.roles.view',
      'tenant.roles.create',
      'tenant.roles.update',
      'tenant.roles.delete',
    ],
  },

  // ========== COMPANIES ==========
  {
    id: 'companies-read',
    name: 'View Companies',
    description: 'View company information',
    category: 'Companies',
    permissions: ['companies.view'],
  },
  {
    id: 'companies-write',
    name: 'Manage Companies',
    description: 'Create and update companies',
    category: 'Companies',
    permissions: ['companies.view', 'companies.create', 'companies.update'],
  },
  {
    id: 'companies-full',
    name: 'Full Company Access',
    description: 'Complete company management',
    category: 'Companies',
    permissions: [
      'companies.view',
      'companies.create',
      'companies.update',
      'companies.delete',
    ],
  },

  // ========== AGENCIES ==========
  {
    id: 'agencies-read',
    name: 'View Agencies',
    description: 'View agency information',
    category: 'Agencies',
    permissions: ['agencies.view', 'agencies.notes.view'],
  },
  {
    id: 'agencies-write',
    name: 'Manage Agencies',
    description: 'Create and update agencies',
    category: 'Agencies',
    permissions: [
      'agencies.view',
      'agencies.create',
      'agencies.update',
      'agencies.notes.add',
      'agencies.notes.view',
    ],
  },
  {
    id: 'agencies-full',
    name: 'Full Agency Access',
    description: 'Complete agency management',
    category: 'Agencies',
    permissions: [
      'agencies.view',
      'agencies.create',
      'agencies.update',
      'agencies.delete',
      'agencies.assign_contractor',
      'agencies.manage_team',
      'agencies.notes.add',
      'agencies.notes.view',
    ],
  },

  // ========== CONTRACTORS ==========
  {
    id: 'contractors-read',
    name: 'View Contractors',
    description: 'View contractor information',
    category: 'Contractors',
    permissions: ['contractors.view', 'contractors.documents.view'],
  },
  {
    id: 'contractors-write',
    name: 'Manage Contractors',
    description: 'Create and update contractors',
    category: 'Contractors',
    permissions: [
      'contractors.view',
      'contractors.create',
      'contractors.update',
      'contractors.documents.upload',
      'contractors.documents.view',
    ],
  },
  {
    id: 'contractors-onboarding',
    name: 'Contractor Onboarding',
    description: 'Manage contractor onboarding process',
    category: 'Contractors',
    permissions: [
      'contractors.onboarding.start',
      'contractors.onboarding.update',
      'contractors.onboarding.review',
      'contractors.onboarding.validate',
    ],
  },
  {
    id: 'contractors-full',
    name: 'Full Contractor Access',
    description: 'Complete contractor management',
    category: 'Contractors',
    permissions: [
      'contractors.view',
      'contractors.create',
      'contractors.update',
      'contractors.delete',
      'contractors.documents.upload',
      'contractors.documents.view',
      'contractors.documents.delete',
      'contractors.onboarding.start',
      'contractors.onboarding.update',
      'contractors.onboarding.review',
      'contractors.onboarding.validate',
      'contractors.assign_to_agency',
      'contractors.change_status',
    ],
  },

  // ========== CONTRACTS ==========
  {
    id: 'contracts-read',
    name: 'View Contracts',
    description: 'View contract information',
    category: 'Contracts',
    permissions: ['contracts.view', 'contracts.download_pdf'],
  },
  {
    id: 'contracts-write',
    name: 'Manage Contracts',
    description: 'Create and update contracts',
    category: 'Contracts',
    permissions: [
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'contracts.upload_pdf',
      'contracts.download_pdf',
      'contracts.generate_reference',
    ],
  },
  {
    id: 'contracts-approve',
    name: 'Contract Approval',
    description: 'Approve or reject contracts',
    category: 'Contracts',
    permissions: [
      'contracts.view',
      'contracts.approve',
      'contracts.reject',
      'contracts.send',
    ],
  },
  {
    id: 'contracts-full',
    name: 'Full Contract Access',
    description: 'Complete contract management',
    category: 'Contracts',
    permissions: [
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'contracts.delete',
      'contracts.send',
      'contracts.approve',
      'contracts.reject',
      'contracts.upload_pdf',
      'contracts.download_pdf',
      'contracts.generate_reference',
    ],
  },

  // ========== INVOICES ==========
  {
    id: 'invoices-read',
    name: 'View Invoices',
    description: 'View invoice information',
    category: 'Invoices',
    permissions: ['invoices.view'],
  },
  {
    id: 'invoices-write',
    name: 'Manage Invoices',
    description: 'Create and update invoices',
    category: 'Invoices',
    permissions: [
      'invoices.view',
      'invoices.create',
      'invoices.update',
      'invoices.send',
    ],
  },
  {
    id: 'invoices-payment',
    name: 'Invoice Payments',
    description: 'Mark invoices as paid',
    category: 'Invoices',
    permissions: ['invoices.view', 'invoices.mark_paid'],
  },
  {
    id: 'invoices-full',
    name: 'Full Invoice Access',
    description: 'Complete invoice management',
    category: 'Invoices',
    permissions: [
      'invoices.view',
      'invoices.create',
      'invoices.update',
      'invoices.delete',
      'invoices.send',
      'invoices.mark_paid',
      'invoices.export',
    ],
  },

  // ========== PAYROLL ==========
  {
    id: 'payroll-read',
    name: 'View Payroll',
    description: 'View payroll information',
    category: 'Payroll',
    permissions: ['payroll.view', 'payslip.view'],
  },
  {
    id: 'payroll-process',
    name: 'Process Payroll',
    description: 'Generate and process payroll',
    category: 'Payroll',
    permissions: [
      'payroll.view',
      'payroll.generate',
      'payroll.update',
      'payroll.send',
      'payslip.generate',
      'payslip.send',
    ],
  },
  {
    id: 'payroll-full',
    name: 'Full Payroll Access',
    description: 'Complete payroll management',
    category: 'Payroll',
    permissions: [
      'payroll.view',
      'payroll.generate',
      'payroll.update',
      'payroll.send',
      'payroll.mark_paid',
      'payroll.create',
      'payroll.delete',
      'payslip.view',
      'payslip.generate',
      'payslip.update',
      'payslip.send',
      'payslip.mark_paid',
      'payslip.create',
      'payslip.delete',
    ],
  },

  // ========== TASKS & LEADS ==========
  {
    id: 'tasks-basic',
    name: 'Basic Task Access',
    description: 'View and update tasks',
    category: 'Tasks',
    permissions: ['tasks.view', 'tasks.update', 'tasks.complete'],
  },
  {
    id: 'tasks-full',
    name: 'Full Task Access',
    description: 'Complete task management',
    category: 'Tasks',
    permissions: [
      'tasks.view',
      'tasks.create',
      'tasks.update',
      'tasks.delete',
      'tasks.assign',
      'tasks.complete',
    ],
  },
  {
    id: 'leads-full',
    name: 'Lead Management',
    description: 'Complete lead management',
    category: 'Leads',
    permissions: [
      'leads.view',
      'leads.create',
      'leads.update',
      'leads.delete',
      'leads.export',
    ],
  },

  // ========== SETTINGS & ADMIN ==========
  {
    id: 'settings-read',
    name: 'View Settings',
    description: 'View system settings',
    category: 'Settings',
    permissions: ['settings.view'],
  },
  {
    id: 'settings-write',
    name: 'Manage Settings',
    description: 'Update system settings',
    category: 'Settings',
    permissions: ['settings.view', 'settings.update'],
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    description: 'View audit logs',
    category: 'Settings',
    permissions: ['audit_logs.view'],
  },

  // ========== ONBOARDING ==========
  {
    id: 'onboarding-templates',
    name: 'Onboarding Templates',
    description: 'Manage onboarding templates',
    category: 'Onboarding',
    permissions: [
      'onboarding.templates.view',
      'onboarding.templates.create',
      'onboarding.templates.update',
      'onboarding.templates.delete',
      'onboarding.questions.add',
      'onboarding.questions.update',
      'onboarding.questions.delete',
    ],
  },
  {
    id: 'onboarding-responses',
    name: 'Onboarding Responses',
    description: 'View and review onboarding responses',
    category: 'Onboarding',
    permissions: [
      'onboarding.responses.view',
      'onboarding.responses.review',
    ],
  },
];

/**
 * Get all permission groups
 */
export function getAllPermissionGroups(): PermissionGroup[] {
  return PERMISSION_GROUPS;
}

/**
 * Get permission groups by category
 */
export function getPermissionGroupsByCategory(category: string): PermissionGroup[] {
  return PERMISSION_GROUPS.filter((group) => group.category === category);
}

/**
 * Get permission group by ID
 */
export function getPermissionGroupById(id: string): PermissionGroup | undefined {
  return PERMISSION_GROUPS.find((group) => group.id === id);
}

/**
 * Get all permissions from multiple groups
 */
export function getPermissionsFromGroups(groupIds: string[]): string[] {
  const permissions = new Set<string>();
  
  groupIds.forEach((groupId) => {
    const group = getPermissionGroupById(groupId);
    if (group) {
      group.permissions.forEach((perm) => permissions.add(perm));
    }
  });

  return Array.from(permissions);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(PERMISSION_GROUPS.map((group) => group.category)));
}
