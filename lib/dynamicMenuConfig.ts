import { 
  LayoutDashboard, Users, Building2, UserCheck, DollarSign, 
  Settings, FileText, Receipt, Clock, Upload, UserPlus, 
  Briefcase, PieChart, CheckSquare, TrendingUp, ClipboardList,
  UserCog, FileType, ListChecks, Layers, Globe, BarChart3, Palette,
  Landmark, Coins, Webhook, Mail, MessageSquare, Activity, 
  CreditCard, Scale, FileSignature, UserCircle, MessageSquarePlus
} from "lucide-react"

import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions"

export interface MenuItem {
  label: string
  href: string
  icon: any
  description?: string
  permissions?: string[]
  requireAll?: boolean
  submenu?: MenuItem[]
}

// Helper to map V3 permissions
const P = (resource: Resource, action: Action, scope: PermissionScope) =>
  buildPermissionKey(resource, action, scope)

/**
 * MENU V3 ● Compatible avec permissions: "resource.action.scope"
 */
export const dynamicMenuConfig: MenuItem[] = [

  {
    label: "SuperadminDashboard",
    href: "/superadmin",
    icon: LayoutDashboard,
    description: "Your dashboard",
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ]
  },
  {
    label: "SuperAdminUser",
    href: "/superadmin/users",
    icon: LayoutDashboard,
    description: "Your dashboard",
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ]
  },
  {
    label: "SuperAdminTenants",
    href: "/superadmin/tenants",
    icon: LayoutDashboard,
    description: "Your dashboard",
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ]
  },
  {
    label: "SuperAdminSettings",
    href: "/superadmin/settings",
    icon: ClipboardList,
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "SuperAdminCountries",
        href: "/superadmin/settings/countries",
        icon: UserCheck,
        permissions: [
          P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "SuperAdminCurrencies",
        href: "/superadmin/settings/currencies",
        icon: CheckSquare,
        permissions: [
          P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "SuperAdminFeatures",
        href: "/superadmin/settings/features",
        icon: FileType,
        permissions: [
          P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "SuperAdminSubscriptions",
        href: "/superadmin/settings/subscriptions",
        icon: UserCheck,
        permissions: [
          P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
        ]
      },
    ]
  },
  {
    label: "SuperAdminImpersonations",
    href: "/superadmin/impersonations",
    icon: LayoutDashboard,
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ]
  },
  {
    label: "SuperAdminAnalytics",
    href: "/superadmin/analytics",
    icon: LayoutDashboard,
    permissions: [
      P(Resource.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
    ]
  },

  // ===========================
  // DASHBOARD
  // ===========================
  {
    label: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
    description: "Your dashboard",
    permissions: [
      P(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
    ]
  },

  // ===========================
  // PROFILE
  // ===========================
  {
    label: "My Profile",
    href: "/profile",
    icon: UserCircle,
    description: "View your profile",
    permissions: [
      P(Resource.PROFILE, Action.ACCESS, PermissionScope.PAGE),
    ],
  },

  // ===========================
  // CONTRACTS
  // ===========================
  {
    label: "Contracts",
    href: "/contracts/simple",
    icon: FileText,
    permissions: [
      P(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
    ],
  },

  // ===========================
  // TIMESHEETS
  // ===========================
  {
    label: "Timesheets",
    href: "/timesheets",
    icon: Clock,
    permissions: [
      P(Resource.TIMESHEET, Action.ACCESS, PermissionScope.PAGE),
    ],
  },

  // ===========================
  // INVOICES
  // ===========================
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    permissions: [
      P(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE),
    ],
  },

  

  // ===========================
  // EXPENSES
  // ===========================
  /*{
    label: "Expenses",
    href: "/expenses",
    icon: Upload,
    permissions: [
      P(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
      P(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    ],
  },*/
  {
    label: "Payslips",
    href: "/payments/payslips",
    icon: FileText,
    permissions: [
      P(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
    ]
  },
  {
    label: "Remits",
    href: "/payments/remits",
    icon: DollarSign,
    permissions: [
      P(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
    ]
  },

  // ===========================
  // PAYMENTS
  // ===========================
  /*{
    label: "Payments",
    href: "/payments",
    icon: DollarSign,
    permissions: [
      P(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),
      P(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
      P(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
      P(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "Payslips",
        href: "/payments/payslips",
        icon: FileText,
        permissions: [
          P(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),
          P(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Remits",
        href: "/payments/remits",
        icon: DollarSign,
        permissions: [
          P(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
          P(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
        ]
      }
    ]
  },*/

  // ===========================
  // ONBOARDING
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
        description: "View and complete your onboarding",
        permissions: [
          P(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
        ]
      },
      {
        label: "All Onboardings",
        href: "/onboarding",
        icon: ListChecks,
        description: "Review all user onboardings",
        permissions: [
          P(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Manage Templates",
        href: "/onboarding/templates",
        icon: FileType,
        description: "Create and edit onboarding templates",
        permissions: [
          P(Resource.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
    ]
  },

  // ===========================
  // REFERRALS
  // ===========================
  {
    label: "Referrals",
    href: "/referrals",
    icon: UserPlus,
    permissions: [
      P(Resource.REFERRAL, Action.ACCESS, PermissionScope.PAGE),
    ]
  },

  // ===========================
  // TASKS
  // ===========================
  {
    label: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
    permissions: [
      P(Resource.TASK, Action.ACCESS, PermissionScope.PAGE),
    ]
  },

  // ===========================
  // LEADS
  // ===========================
  {
    label: "Leads",
    href: "/leads",
    icon: TrendingUp,
    permissions: [
      P(Resource.LEAD, Action.ACCESS, PermissionScope.PAGE),
    ]
  },

  // ===========================
  // REPORTS
  // ===========================
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permissions: [
      P(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.SMS_LOG, Action.ACCESS, PermissionScope.PAGE),
    ],
    submenu: [
      {
        label: "Overview",
        href: "/reports",
        icon: BarChart3,
        permissions: [
          P(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: Activity,
        permissions: [
          P(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Send Email",
        href: "/reports/send-email",
        icon: Mail,
        permissions: [
          P(Resource.EMAIL, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Email Logs",
        href: "/reports/email-logs",
        icon: Mail,
        permissions: [
          P(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "SMS Logs",
        href: "/reports/sms-logs",
        icon: MessageSquare,
        permissions: [
          P(Resource.SMS_LOG, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
    ]
  },

  // ===========================
  // FEATURE REQUESTS
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
        permissions: [
          P(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN),
        ]
      },
      {
        label: "Manage Requests",
        href: "/feature-requests/manage",
        icon: ListChecks,
        permissions: [
          P(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
    ]
  },

  // ===========================
  // SETTINGS (HUGE SECTION)
  // ===========================
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    permissions: [
      P(Resource.SETTINGS, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.USER, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.PERMISSION, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.BANK, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.CURRENCY, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.LOGIN, Action.ACCESS, PermissionScope.PAGE),
      P(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE),
    ],
    submenu: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permissions: [
          P(Resource.USER, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Roles",
        href: "/settings/roles",
        icon: UserCog,
        permissions: [
          P(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Permissions",
        href: "/settings/permissions",
        icon: CheckSquare,
        permissions: [
          P(Resource.PERMISSION, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Companies",
        href: "/settings/companies",
        icon: Layers,
        permissions: [
          P(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Banks",
        href: "/settings/banks",
        icon: Landmark,
        permissions: [
          P(Resource.BANK, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Currencies",
        href: "/settings/currencies",
        icon: Coins,
        permissions: [
          P(Resource.CURRENCY, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Countries",
        href: "/settings/countries",
        icon: Globe,
        permissions: [
          P(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Branding",
        href: "/settings/branding/login",
        icon: Palette,
        permissions: [
          P(Resource.LOGIN, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Customisation",
        href: "/settings/tenant",
        icon: Palette,
        permissions: [
          P(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE),
        ]
      },
      {
        label: "Webhooks",
        href: "/settings/webhooks",
        icon: Webhook,
        permissions: [
          P(Resource.WEBHOOK, Action.ACCESS, PermissionScope.PAGE),
        ]
      }
    ]
  }

]
/**
 * Filter menu by permissions (RBAC-only)
 */
export function filterMenuByPermissions(
  menuItems: MenuItem[],
  userPermissions: string[]
): MenuItem[] {

  return menuItems
    .map(item => {

      // Normalize for safety
      const hasAccess = item.permissions
        ? item.permissions.some(p => userPermissions.includes(p))
        : true;

      if (!hasAccess) return null;

      // Handle submenus
      if (item.submenu) {
        const filteredSubmenu = filterMenuByPermissions(item.submenu, userPermissions);
        if (filteredSubmenu.length === 0) return null;
        return { ...item, submenu: filteredSubmenu };
      }

      return item;
    })
    .filter(Boolean) as MenuItem[];
}

export function getDynamicMenu(userPermissions: string[]) {
  return filterMenuByPermissions(dynamicMenuConfig, userPermissions);
}
