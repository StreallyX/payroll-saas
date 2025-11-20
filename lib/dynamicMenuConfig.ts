import { 
  LayoutDashboard, Users, Building2, UserCheck, DollarSign, 
  Settings, FileText, Receipt, Clock, Upload, UserPlus, 
  Briefcase, PieChart, CheckSquare, TrendingUp, ClipboardList,
  UserCog, FileType, ListChecks, Layers, Globe, BarChart3, Palette,
  Landmark, Coins, Webhook, Mail, MessageSquare, Activity, 
  CreditCard, Scale, FileSignature, UserCircle
} from "lucide-react"

import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions-v2"

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

  // ===========================
  // DASHBOARD
  // ===========================
  {
    label: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
    description: "Your dashboard",
    permissions: [
      P(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),
      P(Resource.DASHBOARD, Action.READ, PermissionScope.GLOBAL),
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
      P(Resource.USER, Action.READ, PermissionScope.OWN),
    ],
  },

  // ===========================
  // CONTRACTS
  // ===========================
  {
    label: "Contracts",
    href: "/contracts",
    icon: FileText,
    permissions: [
      P(Resource.CONTRACT, Action.READ, PermissionScope.OWN),
      P(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.INVOICE, Action.READ, PermissionScope.OWN),
      P(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.TIMESHEET, Action.READ, PermissionScope.OWN),
      P(Resource.TIMESHEET, Action.LIST, PermissionScope.GLOBAL),
    ],
  },

  // ===========================
  // EXPENSES
  // ===========================
  {
    label: "Expenses",
    href: "/expenses",
    icon: Upload,
    permissions: [
      P(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
      P(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    ],
  },

  // ===========================
  // PAYMENTS
  // ===========================
  {
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
  },

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
        permissions: [
          P(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
        ]
      },
      {
        label: "Review Submissions",
        href: "/onboarding/review",
        icon: CheckSquare,
        permissions: [
          P(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Templates",
        href: "/onboarding/templates",
        icon: FileType,
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
      P(Resource.REFERRAL, Action.READ, PermissionScope.OWN),
      P(Resource.REFERRAL, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.TASK, Action.READ, PermissionScope.OWN),
      P(Resource.TASK, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.LEAD, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "Overview",
        href: "/reports",
        icon: BarChart3,
        permissions: [
          P(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: Activity,
        permissions: [
          P(Resource.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Email Logs",
        href: "/reports/email-logs",
        icon: Mail,
        permissions: [
          P(Resource.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "SMS Logs",
        href: "/reports/sms-logs",
        icon: MessageSquare,
        permissions: [
          P(Resource.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL),
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
      P(Resource.SETTINGS, Action.READ, PermissionScope.GLOBAL),
      P(Resource.TENANT, Action.READ, PermissionScope.TENANT),
      P(Resource.USER, Action.LIST, PermissionScope.GLOBAL),
    ],
    submenu: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permissions: [
          P(Resource.USER, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Roles",
        href: "/settings/roles",
        icon: UserCog,
        permissions: [
          P(Resource.ROLE, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Permissions",
        href: "/settings/permissions",
        icon: CheckSquare,
        permissions: [
          P(Resource.PERMISSION, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Companies",
        href: "/settings/companies",
        icon: Layers,
        permissions: [
          P(Resource.COMPANY, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Banks",
        href: "/settings/banks",
        icon: Landmark,
        permissions: [
          P(Resource.BANK, Action.LIST, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Currencies",
        href: "/settings/currencies",
        icon: Coins,
        permissions: [
          P(Resource.SETTINGS, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Countries",
        href: "/settings/countries",
        icon: Globe,
        permissions: [
          P(Resource.SETTINGS, Action.READ, PermissionScope.GLOBAL),
        ]
      },
      {
        label: "Branding",
        href: "/settings/branding/login",
        icon: Palette,
        permissions: [
          P(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT),
        ]
      },
      {
        label: "Webhooks",
        href: "/settings/webhooks",
        icon: Webhook,
        permissions: [
          P(Resource.WEBHOOK, Action.LIST, PermissionScope.GLOBAL),
        ]
      }
    ]
  }

]

/**
 * Filter menu by permissions
 */
export function filterMenuByPermissions(
  menuItems: MenuItem[],
  userPermissions: string[],
  isSuperAdmin = false
): MenuItem[] {

  if (isSuperAdmin) return menuItems

  return menuItems
    .map(item => {

      const hasAccess = item.permissions
        ? item.permissions.some(p => userPermissions.includes(p))
        : true

      if (!hasAccess) return null

      if (item.submenu) {
        const filtered = filterMenuByPermissions(item.submenu, userPermissions, isSuperAdmin)
        if (filtered.length === 0) return null
        return { ...item, submenu: filtered }
      }

      return item
    })
    .filter(Boolean) as MenuItem[]
}

export function getDynamicMenu(userPermissions: string[], isSuperAdmin = false) {
  return filterMenuByPermissions(dynamicMenuConfig, userPermissions, isSuperAdmin)
}
