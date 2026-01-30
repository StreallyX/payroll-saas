import {
  LayoutDashboard, Users, Building2, DollarSign,
  Settings, FileText, Receipt, Clock, UserPlus,
  HardHat, Wallet, Landmark, Layers, Globe, Coins,
  BarChart3, Activity, Mail, MessageSquare, TrendingUp,
  MessageSquarePlus, ListChecks, UserCog, CheckSquare,
  Palette, Webhook, ClipboardList, UserCheck, FileType,
} from "lucide-react"

import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions"

export interface MenuItem {
  label: string
  href: string
  icon: any
  description?: string
  permissions?: string[]
  requireAll?: boolean
  excludeRoles?: string[] // Roles that should NOT see this menu item
  submenu?: MenuItem[]
}

// Helper to map V3 permissions
const P = (resource: Resource, action: Action, scope: PermissionScope) =>
  buildPermissionKey(resource, action, scope)

/**
 * FULL MENU - All features accessible
 * Organized for clarity while keeping all functionality
 */
export const dynamicMenuConfig: MenuItem[] = [

  // ===========================
  // SUPERADMIN SECTION
  // ===========================
  {
    label: "Admin Dashboard",
    href: "/superadmin",
    icon: LayoutDashboard,
    permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
  },
  {
    label: "All Users",
    href: "/superadmin/users",
    icon: Users,
    permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
  },
  {
    label: "All Tenants",
    href: "/superadmin/tenants",
    icon: Building2,
    permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
  },
  {
    label: "Platform Settings",
    href: "/superadmin/settings",
    icon: Settings,
    permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)],
    submenu: [
      {
        label: "Countries",
        href: "/superadmin/settings/countries",
        icon: Globe,
        permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
      },
      {
        label: "Currencies",
        href: "/superadmin/settings/currencies",
        icon: Coins,
        permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
      },
      {
        label: "Features",
        href: "/superadmin/settings/features",
        icon: FileType,
        permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
      },
      {
        label: "Subscriptions",
        href: "/superadmin/settings/subscriptions",
        icon: UserCheck,
        permissions: [P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL)]
      },
    ]
  },

  // ===========================
  // 1. DASHBOARD
  // ===========================
  {
    label: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
    description: "Overview of your activity",
    permissions: [P(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 1.5 MY COMPANY (for agency users - NOT for admins who manage the platform)
  // ===========================
  {
    label: "My Company",
    href: "/my-company",
    icon: Building2,
    description: "Manage your company",
    permissions: [P(Resource.COMPANY, Action.UPDATE, PermissionScope.OWN)],
    excludeRoles: ["admin", "super_admin", "superadmin"]
  },

  // ===========================
  // 2. AGENCY / CLIENTS
  // ===========================
  {
    label: "Agency / Clients",
    href: "/agencies",
    icon: Building2,
    description: "Manage your clients and agencies",
    permissions: [P(Resource.AGENCY, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 3. CONTRACTS
  // ===========================
  {
    label: "Contracts",
    href: "/contracts/simple",
    icon: FileText,
    description: "View and manage contracts",
    permissions: [P(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 4. CONTRACTORS / WORKERS
  // ===========================
  {
    label: "Contractors / Workers",
    href: "/contractors",
    icon: HardHat,
    description: "Manage your workforce",
    permissions: [P(Resource.CONTRACTOR, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 5. ONBOARDING
  // ===========================
  {
    label: "Onboarding",
    href: "/onboarding",
    icon: ClipboardList,
    permissions: [
      P(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
      P(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
      P(Resource.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "My Onboarding",
        href: "/onboarding/my-onboarding",
        icon: UserCheck,
        permissions: [P(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN)]
      },
      {
        label: "All Onboardings",
        href: "/onboarding",
        icon: ListChecks,
        permissions: [P(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL)]
      },
      {
        label: "Manage Templates",
        href: "/onboarding/templates",
        icon: FileType,
        permissions: [P(Resource.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL)]
      },
    ]
  },

  // ===========================
  // 6. PAYROLL PARTNERS
  // ===========================
  {
    label: "Payroll Partners",
    href: "/payroll-partners",
    icon: Wallet,
    description: "Manage payroll partners",
    permissions: [P(Resource.PAYROLL_PARTNER, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 7. TIMESHEETS
  // ===========================
  {
    label: "Timesheets",
    href: "/timesheets",
    icon: Clock,
    description: "Track working hours",
    permissions: [P(Resource.TIMESHEET, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 8. INVOICES
  // ===========================
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    description: "Manage invoices",
    permissions: [P(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 9. PAYSLIPS
  // ===========================
  {
    label: "Payslips",
    href: "/payments/payslips",
    icon: FileText,
    permissions: [P(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 10. REMITS
  // ===========================
  {
    label: "Remits",
    href: "/payments/remits",
    icon: DollarSign,
    permissions: [P(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 11. REFERRALS
  // ===========================
  {
    label: "Referrals",
    href: "/referrals",
    icon: UserPlus,
    permissions: [P(Resource.REFERRAL, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 12. LEADS
  // ===========================
  {
    label: "Leads",
    href: "/leads",
    icon: TrendingUp,
    permissions: [P(Resource.LEAD, Action.ACCESS, PermissionScope.PAGE)]
  },

  // ===========================
  // 13. REPORTS
  // ===========================
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permissions: [
      P(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE),
    ],
    submenu: [
      {
        label: "Overview",
        href: "/reports",
        icon: BarChart3,
        permissions: [P(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: Activity,
        permissions: [P(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Email Logs",
        href: "/reports/email-logs",
        icon: Mail,
        permissions: [P(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "SMS Logs",
        href: "/reports/sms-logs",
        icon: MessageSquare,
        permissions: [P(Resource.SMS_LOG, Action.ACCESS, PermissionScope.PAGE)]
      },
    ]
  },

  // ===========================
  // 14. FEATURE REQUESTS
  // ===========================
  {
    label: "Feature Requests",
    href: "/feature-requests/new",
    icon: MessageSquarePlus,
    permissions: [
      P(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN),
      P(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "Submit Request",
        href: "/feature-requests/new",
        icon: MessageSquarePlus,
        permissions: [P(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN)]
      },
      {
        label: "Manage Requests",
        href: "/feature-requests/manage",
        icon: ListChecks,
        permissions: [P(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL)]
      },
    ]
  },

  // ===========================
  // 15. SETTINGS
  // ===========================
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    permissions: [
      P(Resource.USER, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.BANK, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE),
    ],
    submenu: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permissions: [P(Resource.USER, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Roles",
        href: "/settings/roles",
        icon: UserCog,
        permissions: [P(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Permissions",
        href: "/settings/permissions",
        icon: CheckSquare,
        permissions: [P(Resource.PERMISSION, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Companies",
        href: "/settings/companies",
        icon: Layers,
        permissions: [P(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Banks",
        href: "/settings/banks",
        icon: Landmark,
        permissions: [P(Resource.BANK, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Currencies",
        href: "/settings/currencies",
        icon: Coins,
        permissions: [P(Resource.CURRENCY, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Countries",
        href: "/settings/countries",
        icon: Globe,
        permissions: [P(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Branding",
        href: "/settings/branding/login",
        icon: Palette,
        permissions: [P(Resource.LOGIN, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Customisation",
        href: "/settings/tenant",
        icon: Palette,
        permissions: [P(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE)]
      },
      {
        label: "Webhooks",
        href: "/settings/webhooks",
        icon: Webhook,
        permissions: [P(Resource.WEBHOOK, Action.ACCESS, PermissionScope.PAGE)]
      }
    ]
  }

]

/**
 * Filter menu by permissions and role exclusions (RBAC)
 */
export function filterMenuByPermissions(
  menuItems: MenuItem[],
  userPermissions: string[],
  userRole?: string | null
): MenuItem[] {
  return menuItems
    .map(item => {
      // Check if user's role is excluded from this menu item
      if (item.excludeRoles && userRole) {
        const roleLower = userRole.toLowerCase()
        if (item.excludeRoles.some(r => roleLower.includes(r.toLowerCase()))) {
          return null
        }
      }

      const hasAccess = item.permissions
        ? item.permissions.some(p => userPermissions.includes(p))
        : true;

      if (!hasAccess) return null;

      if (item.submenu) {
        const filteredSubmenu = filterMenuByPermissions(item.submenu, userPermissions, userRole);
        if (filteredSubmenu.length === 0) return null;
        return { ...item, submenu: filteredSubmenu };
      }

      return item;
    })
    .filter(Boolean) as MenuItem[];
}

export function getDynamicMenu(userPermissions: string[], userRole?: string | null) {
  return filterMenuByPermissions(dynamicMenuConfig, userPermissions, userRole);
}
