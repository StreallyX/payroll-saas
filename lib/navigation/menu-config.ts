
import { LucideIcon } from "lucide-react";
import { PERMISSION_TREE } from "@/server/rbac/permissions";

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon: string; // Nom de l'icône Lucide
  permission?: string; // Permission requise pour voir cet item
  permissions?: string[]; // Permissions multiples (OU logique)
  requireAll?: boolean; // true = ET logique, false = OU logique
  children?: MenuItem[];
  badge?: string;
  description?: string;
  category?: string;
}

export const MENU_CONFIG: MenuItem[] = [
  // Dashboard - accessible à tous
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/home",
    icon: "LayoutDashboard",
    description: "Overview and analytics",
  },

  // Team Management
  {
    id: "team",
    label: "Team",
    icon: "Users",
    category: "Management",
    children: [
      {
        id: "users",
        label: "Users",
        href: "/users",
        icon: "Users",
        permission: PERMISSION_TREE.tenant.users.view,
        description: "Manage user accounts",
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        href: "/settings/roles",
        icon: "UserCog",
        permission: PERMISSION_TREE.tenant.roles.view,
        description: "Configure roles and permissions",
      },
      {
        id: "permissions",
        label: "Permissions",
        href: "/settings/permissions",
        icon: "Shield",
        permission: PERMISSION_TREE.tenant.roles.view,
        description: "View all system permissions",
      },
    ],
  },

  // Workforce
  {
    id: "workforce",
    label: "Workforce",
    icon: "UserCheck",
    category: "Operations",
    children: [
      {
        id: "contractors",
        label: "Contractors",
        href: "/contractors",
        icon: "UserCheck",
        permission: PERMISSION_TREE.contractors.view,
        description: "Manage contractor profiles",
      },
      {
        id: "agencies",
        label: "Agencies",
        href: "/agencies",
        icon: "Building2",
        permission: PERMISSION_TREE.agencies.view,
        description: "Partner agencies",
      },
      {
        id: "companies",
        label: "Companies",
        href: "/settings/companies",
        icon: "Building",
        permission: PERMISSION_TREE.companies.view,
        description: "Client companies",
      },
    ],
  },

  // Operations
  {
    id: "operations",
    label: "Operations",
    icon: "Briefcase",
    category: "Operations",
    children: [
      {
        id: "contracts",
        label: "Contracts",
        href: "/contracts",
        icon: "FileText",
        permission: PERMISSION_TREE.contracts.view,
        description: "Manage contracts",
      },
      {
        id: "onboarding",
        label: "Onboarding",
        href: "/onboarding",
        icon: "ClipboardList",
        permission: PERMISSION_TREE.onboarding.templates.view,
        description: "Onboarding workflows",
      },
      {
        id: "tasks",
        label: "Tasks",
        href: "/tasks",
        icon: "CheckSquare",
        permission: PERMISSION_TREE.tasks.view,
        description: "Task management",
      },
      {
        id: "timesheets",
        label: "Timesheets",
        href: "/timesheets",
        icon: "Clock",
        permission: PERMISSION_TREE.timesheet.view,
        description: "Timesheet management",
      },
      {
        id: "expenses",
        label: "Expenses",
        href: "/expenses",
        icon: "Receipt",
        permission: PERMISSION_TREE.expense.view,
        description: "Expense tracking",
      },
    ],
  },

  // Finance
  {
    id: "finance",
    label: "Finance",
    icon: "DollarSign",
    category: "Finance",
    children: [
      {
        id: "invoices",
        label: "Invoices",
        href: "/invoices",
        icon: "Receipt",
        permission: PERMISSION_TREE.invoices.view,
        description: "Invoice management",
      },
      {
        id: "payroll",
        label: "Payroll",
        href: "/payroll",
        icon: "DollarSign",
        permission: PERMISSION_TREE.payroll.view,
        description: "Payroll processing",
      },
      {
        id: "payslips",
        label: "Payslips",
        href: "/payslips",
        icon: "FileText",
        permission: PERMISSION_TREE.payslip.view,
        description: "Payslip generation",
      },
      {
        id: "banks",
        label: "Banks",
        href: "/settings/banks",
        icon: "Landmark",
        permission: PERMISSION_TREE.banks.view,
        description: "Bank accounts",
      },
    ],
  },

  // Sales
  {
    id: "sales",
    label: "Sales",
    icon: "TrendingUp",
    category: "Sales",
    children: [
      {
        id: "leads",
        label: "Leads",
        href: "/leads",
        icon: "TrendingUp",
        permission: PERMISSION_TREE.leads.view,
        description: "Lead management",
      },
    ],
  },

  // Reports & Analytics
  {
    id: "reports",
    label: "Reports",
    icon: "BarChart3",
    category: "Analytics",
    children: [
      {
        id: "activity-logs",
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: "ListChecks",
        permission: PERMISSION_TREE.audit.view,
        description: "Audit trail",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/reports/analytics",
        icon: "PieChart",
        permission: PERMISSION_TREE.audit.view,
        description: "Business analytics",
      },
      {
        id: "user-activity",
        label: "User Activity",
        href: "/reports/user-activity",
        icon: "Activity",
        permission: PERMISSION_TREE.audit.view,
        description: "User activity monitoring",
      },
      {
        id: "email-logs",
        label: "Email Logs",
        href: "/reports/email-logs",
        icon: "Mail",
        permission: PERMISSION_TREE.audit.view,
        description: "Email delivery logs",
      },
      {
        id: "sms-logs",
        label: "SMS Logs",
        href: "/reports/sms-logs",
        icon: "MessageSquare",
        permission: PERMISSION_TREE.audit.view,
        description: "SMS delivery logs",
      },
    ],
  },

  // Settings
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    category: "System",
    children: [
      {
        id: "profile",
        label: "My Profile",
        href: "/settings/profile",
        icon: "User",
        description: "Personal settings",
      },
      {
        id: "tenant",
        label: "Tenant Settings",
        href: "/settings/tenant",
        icon: "Building",
        permission: PERMISSION_TREE.tenant.view,
        description: "Organization settings",
      },
      {
        id: "currencies",
        label: "Currencies",
        href: "/settings/currencies",
        icon: "Coins",
        permission: PERMISSION_TREE.settings.view,
        description: "Currency management",
      },
      {
        id: "countries",
        label: "Countries",
        href: "/settings/countries",
        icon: "Globe",
        permission: PERMISSION_TREE.settings.view,
        description: "Country settings",
      },
      {
        id: "document-types",
        label: "Document Types",
        href: "/settings/document-types",
        icon: "FileType",
        permission: PERMISSION_TREE.documentTypes.view,
        description: "Document configuration",
      },
      {
        id: "email-templates",
        label: "Email Templates",
        href: "/settings/templates/email",
        icon: "Mail",
        permission: PERMISSION_TREE.settings.update,
        description: "Email template management",
      },
      {
        id: "pdf-templates",
        label: "PDF Templates",
        href: "/settings/templates/pdf",
        icon: "FileText",
        permission: PERMISSION_TREE.settings.update,
        description: "PDF template management",
      },
      {
        id: "onboarding-templates",
        label: "Onboarding Templates",
        href: "/settings/onboarding-templates",
        icon: "ClipboardList",
        permission: PERMISSION_TREE.onboarding.templates.view,
        description: "Onboarding template configuration",
      },
      {
        id: "webhooks",
        label: "Webhooks",
        href: "/settings/webhooks",
        icon: "Webhook",
        permission: PERMISSION_TREE.settings.view,
        description: "Webhook configuration",
      },
    ],
  },
];

/**
 * Filtrer les items de menu selon les permissions de l'utilisateur
 */
export function filterMenuByPermissions(
  items: MenuItem[],
  userPermissions: string[],
  isSuperAdmin: boolean = false
): MenuItem[] {
  // Super admin voit tout
  if (isSuperAdmin) {
    return items;
  }

  return items
    .map(item => {
      // Vérifier la permission de l'item
      const hasPermission = !item.permission || userPermissions.includes(item.permission);

      // Vérifier les permissions multiples
      const hasPermissions = !item.permissions ||
        (item.requireAll
          ? item.permissions.every(p => userPermissions.includes(p))
          : item.permissions.some(p => userPermissions.includes(p)));

      // Si l'item a des enfants, les filtrer récursivement
      if (item.children) {
        const filteredChildren = filterMenuByPermissions(item.children, userPermissions, isSuperAdmin);

        // Si aucun enfant n'est accessible, ne pas afficher le parent
        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      // Si l'item n'a pas la permission, ne pas l'afficher
      if (!hasPermission || !hasPermissions) {
        return null;
      }

      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Obtenir tous les chemins accessibles (pour la navigation)
 */
export function getAccessiblePaths(
  items: MenuItem[],
  userPermissions: string[],
  isSuperAdmin: boolean = false
): string[] {
  const paths: string[] = [];

  const extract = (menuItems: MenuItem[]) => {
    menuItems.forEach(item => {
      if (item.href) {
        paths.push(item.href);
      }
      if (item.children) {
        extract(item.children);
      }
    });
  };

  const filteredMenu = filterMenuByPermissions(items, userPermissions, isSuperAdmin);
  extract(filteredMenu);

  return paths;
}
