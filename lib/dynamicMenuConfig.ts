import { 
  LayoutDashboard, Users, Building2, UserCheck, DollarSign, 
  Settings, FileText, Receipt, Clock, Upload, UserPlus, 
  Briefcase, PieChart, CheckSquare, TrendingUp, ClipboardList,
  UserCog, FileType, ListChecks, Layers, Globe, BarChart3, Palette,
  Landmark, Coins
} from "lucide-react"

export interface MenuItem {
  label: string
  href: string
  icon: any
  description?: string
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  submenu?: MenuItem[]
  badge?: string | number
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

/**
 * Dynamic menu configuration based on permissions
 * Each menu item can have:
 * - permission: single permission required
 * - permissions: array of permissions (uses requireAll to determine AND/OR logic)
 * - requireAll: if true, user must have ALL permissions; if false, user needs ANY permission
 */
export const dynamicMenuConfig: MenuItem[] = [
  { 
    label: "Dashboard", 
    href: "/home", 
    icon: LayoutDashboard,
    description: "System overview and analytics",
    // No permission required - everyone can see dashboard
  },
  { 
    label: "Manage Contracts", 
    href: "/contracts", 
    icon: FileText,
    description: "Contract management and tracking",
    permission: "contracts.view"
  },
  { 
    label: "Manage Onboarding", 
    href: "/onboarding", 
    icon: ClipboardList,
    description: "Onboarding processes and workflows",
    permission: "onboarding.responses.view"
  },
  { 
    label: "My Tasks", 
    href: "/tasks", 
    icon: CheckSquare,
    description: "Your assigned tasks and to-dos",
    permission: "tasks.view",
    badge: "3", // Example: 3 pending tasks
    badgeVariant: "default"
  },
  { 
    label: "Manage Agency/Clients", 
    href: "/agencies", 
    icon: Building2,
    description: "Client agencies and companies",
    permission: "agencies.view"
  },
  { 
    label: "Manage Contractors", 
    href: "/contractors", 
    icon: UserCheck,
    description: "Contractor profiles and status",
    permission: "contractors.view"
  },
  { 
    label: "Leads", 
    href: "/leads", 
    icon: TrendingUp,
    description: "Sales leads and prospects",
    permission: "leads.view"
  },
  { 
    label: "Manage Invoices", 
    href: "/invoices", 
    icon: Receipt,
    description: "Invoice management",
    permission: "invoices.view",
    submenu: [
      {
        label: "Agency Invoices",
        href: "/invoices/agency",
        icon: Building2,
        description: "Agency billing and invoices",
        permission: "invoices.view"
      },
      {
        label: "Contractor Invoices",
        href: "/invoices/contractor",
        icon: UserCheck,
        description: "Contractor billing and invoices",
        permission: "invoices.view"
      },
      {
        label: "Payroll Partner Invoices",
        href: "/invoices/payroll-partner",
        icon: DollarSign,
        description: "Payroll partner invoices",
        permission: "invoices.view"
      }
    ]
  },
  { 
    label: "Payslips", 
    href: "/payslips", 
    icon: FileText,
    description: "Employee payslip management",
    permission: "payslip.view"
  },
  { 
    label: "Settings", 
    href: "/settings", 
    icon: Settings,
    description: "System configuration",
    permissions: [
      "tenant.users.view",
      "settings.view",
      "tenant.roles.view"
    ],
    requireAll: false, // Show if user has ANY of these permissions
    submenu: [
      {
        label: "Manage Users",
        href: "/users",
        icon: Users,
        description: "User accounts and permissions",
        permission: "tenant.users.view"
      },
      {
        label: "Manage Document Type",
        href: "/settings/document-types",
        icon: FileType,
        description: "Document type configuration",
        permission: "settings.view"
      },
      {
        label: "Master Onboarding",
        href: "/settings/master-onboarding",
        icon: ListChecks,
        description: "Onboarding templates and workflows",
        permission: "onboarding.templates.view"
      },
      {
        label: "Payroll Partners",
        href: "/payroll-partners",
        icon: DollarSign,
        description: "Payroll service providers",
        permission: "settings.view"
      },
      {
        label: "Manage Companies",
        href: "/settings/companies",
        icon: Layers,
        description: "Company and organization management",
        permission: "companies.view"
      },
      {
        label: "Manage Banks",
        href: "/settings/banks",
        icon: Landmark,
        description: "Bank accounts management",
        permission: "banks.view"
      },
      {
        label: "Manage Currencies",
        href: "/settings/currencies",
        icon: Coins,
        description: "Currency configuration",
        permission: "settings.view"
      },
      {
        label: "Manage Roles",
        href: "/settings/roles",
        icon: UserCog,
        description: "User roles and permissions",
        permission: "tenant.roles.view"
      },
      {
        label: "Customization",
        href: "/settings/tenant",
        icon: Palette,
        description: "Platform logo and colors",
        permission: "tenant.branding.update"
      },
      {
        label: "Manage Country",
        href: "/settings/countries",
        icon: Globe,
        description: "Country and region settings",
        permission: "settings.view"
      }
    ]
  },
  { 
    label: "Report", 
    href: "/reports", 
    icon: BarChart3,
    description: "Analytics and reporting",
    permission: "audit_logs.view",
    submenu: [
      {
        label: "Overview",
        href: "/reports",
        icon: BarChart3,
        description: "Report overview",
        permission: "audit_logs.view"
      },
      {
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: ListChecks,
        description: "Track all user actions",
        permission: "audit_logs.view"
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: PieChart,
        description: "Business intelligence and insights",
        permission: "audit_logs.view"
      }
    ]
  },
]

/**
 * Filter menu items based on user permissions
 * @param menuItems - The menu configuration to filter
 * @param userPermissions - Array of user's permission keys
 * @param isSuperAdmin - Whether the user is a super admin
 * @returns Filtered menu items
 */
export function filterMenuByPermissions(
  menuItems: MenuItem[],
  userPermissions: string[],
  isSuperAdmin: boolean = false
): MenuItem[] {
  // SuperAdmin sees everything
  if (isSuperAdmin) {
    return menuItems
  }

  return menuItems
    .map(item => {
      // Check if user has permission for this item
      let hasAccess = true

      if (item.permission) {
        hasAccess = userPermissions.includes(item.permission)
      } else if (item.permissions && item.permissions.length > 0) {
        if (item.requireAll) {
          // User must have ALL permissions
          hasAccess = item.permissions.every(p => userPermissions.includes(p))
        } else {
          // User must have ANY permission
          hasAccess = item.permissions.some(p => userPermissions.includes(p))
        }
      }

      if (!hasAccess) {
        return null
      }

      // If item has submenu, filter it recursively
      if (item.submenu && item.submenu.length > 0) {
        const filteredSubmenu = filterMenuByPermissions(item.submenu, userPermissions, isSuperAdmin)
        
        // Only show parent if at least one submenu item is visible
        if (filteredSubmenu.length === 0) {
          return null
        }

        return {
          ...item,
          submenu: filteredSubmenu
        }
      }

      return item
    })
    .filter((item): item is MenuItem => item !== null)
}

/**
 * Get dynamic menu for current user
 * @param userPermissions - Array of user's permission keys
 * @param isSuperAdmin - Whether the user is a super admin
 * @returns Filtered menu items based on permissions
 */
export function getDynamicMenu(
  userPermissions: string[],
  isSuperAdmin: boolean = false
): MenuItem[] {
  return filterMenuByPermissions(dynamicMenuConfig, userPermissions, isSuperAdmin)
}
