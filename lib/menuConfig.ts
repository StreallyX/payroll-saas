
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
  submenu?: MenuItem[]
}

export const menuConfig: Record<string, MenuItem[]> = {
  admin: [
    { 
      label: "Dashboard", 
      href: "/admin", 
      icon: LayoutDashboard,
      description: "System overview and analytics"
    },
    { 
      label: "Manage Contracts", 
      href: "/admin/contracts", 
      icon: FileText,
      description: "Contract management and tracking"
    },
    { 
      label: "Manage Onboarding", 
      href: "/admin/onboarding", 
      icon: ClipboardList,
      description: "Onboarding processes and workflows"
    },
    { 
      label: "My Tasks", 
      href: "/admin/tasks", 
      icon: CheckSquare,
      description: "Your assigned tasks and to-dos"
    },
    { 
      label: "Manage Agency/Clients", 
      href: "/admin/agencies", 
      icon: Building2,
      description: "Client agencies and companies"
    },
    { 
      label: "Manage Contractors", 
      href: "/admin/contractors", 
      icon: UserCheck,
      description: "Contractor profiles and status"
    },
    { 
      label: "Leads", 
      href: "/admin/leads", 
      icon: TrendingUp,
      description: "Sales leads and prospects"
    },
    { 
      label: "Manage Invoices", 
      href: "/admin/invoices", 
      icon: Receipt,
      description: "Invoice management",
      submenu: [
        {
          label: "Agency Invoices",
          href: "/admin/invoices/agency",
          icon: Building2,
          description: "Agency billing and invoices"
        },
        {
          label: "Contractor Invoices",
          href: "/admin/invoices/contractor",
          icon: UserCheck,
          description: "Contractor billing and invoices"
        },
        {
          label: "Payroll Partner Invoices",
          href: "/admin/invoices/payroll-partner",
          icon: DollarSign,
          description: "Payroll partner invoices"
        }
      ]
    },
    { 
      label: "Payslips", 
      href: "/admin/payslips", 
      icon: FileText,
      description: "Employee payslip management"
    },
    { 
      label: "Settings", 
      href: "/admin/settings", 
      icon: Settings,
      description: "System configuration",
      submenu: [
        {
          label: "Manage Users",
          href: "/admin/users",
          icon: Users,
          description: "User accounts and permissions"
        },
        {
          label: "Manage Document Type",
          href: "/admin/settings/document-types",
          icon: FileType,
          description: "Document type configuration"
        },
        {
          label: "Master Onboarding",
          href: "/admin/settings/master-onboarding",
          icon: ListChecks,
          description: "Onboarding templates and workflows"
        },
        {
          label: "Payroll Partners",
          href: "/admin/payroll-partners",
          icon: DollarSign,
          description: "Payroll service providers"
        },
        {
          label: "Manage Companies",
          href: "/admin/settings/companies",
          icon: Layers,
          description: "Company and organization management"
        },
        {
          label: "Manage Banks",
          href: "/admin/settings/banks",
          icon: Landmark,
          description: "Bank accounts management"
        },
        {
          label: "Manage Currencies",
          href: "/admin/settings/currencies",
          icon: Coins,
          description: "Currency configuration"
        },
        {
          label: "Manage Roles",
          href: "/admin/settings/roles",
          icon: UserCog,
          description: "User roles and permissions"
        },
        {
          label: "Customization",
          href: "/admin/settings/personnalisation",
          icon: Palette,
          description: "Platform logo and colors"
        },
        {
          label: "Manage Country",
          href: "/admin/settings/countries",
          icon: Globe,
          description: "Country and region settings"
        }
      ]
    },
    { 
      label: "Report", 
      href: "/admin/report", 
      icon: BarChart3,
      description: "Analytics and reporting",
      submenu: [
        {
          label: "Overview",
          href: "/admin/report",
          icon: BarChart3,
          description: "Report overview"
        },
        {
          label: "Activity Logs",
          href: "/admin/report/activity-logs",
          icon: ListChecks,
          description: "Track all user actions"
        }
      ]
    },
  ],
  agency: [
    { 
      label: "Dashboard", 
      href: "/agency", 
      icon: LayoutDashboard,
      description: "Agency overview and metrics"
    },
    { 
      label: "My Information", 
      href: "/agency/information", 
      icon: Building2,
      description: "Update agency profile"
    },
    { 
      label: "My Contracts", 
      href: "/agency/contracts", 
      icon: FileText,
      description: "Active and past contracts"
    },
    { 
      label: "Manage Invoices", 
      href: "/agency/invoices", 
      icon: Receipt,
      description: "Invoice management and payments"
    },
    { 
      label: "Manage Users", 
      href: "/agency/users", 
      icon: Users,
      description: "Agency team members"
    },
    { 
      label: "Settings", 
      href: "/agency/settings", 
      icon: Settings,
      description: "Agency preferences"
    },
    { 
      label: "Manage Roles", 
      href: "/agency/roles", 
      icon: UserCheck,
      description: "User roles and permissions"
    },
  ],
  payroll_partner: [
    { 
      label: "Dashboard", 
      href: "/payroll", 
      icon: LayoutDashboard,
      description: "Payroll operations overview"
    },
    { 
      label: "My Information", 
      href: "/payroll/information", 
      icon: DollarSign,
      description: "Update payroll partner profile"
    },
    { 
      label: "Contracts", 
      href: "/payroll/contracts", 
      icon: FileText,
      description: "Assigned contracts"
    },
    { 
      label: "Manage Invoices", 
      href: "/payroll/invoices", 
      icon: Receipt,
      description: "Invoice processing"
    },
    { 
      label: "My Remits", 
      href: "/payroll/remits", 
      icon: PieChart,
      description: "Remittance management"
    },
    { 
      label: "Payslips", 
      href: "/payroll/payslips", 
      icon: FileText,
      description: "Employee payslip generation"
    },
    { 
      label: "Manage Users", 
      href: "/payroll/users", 
      icon: Users,
      description: "Payroll team members"
    },
    { 
      label: "Settings", 
      href: "/payroll/settings", 
      icon: Settings,
      description: "Payroll preferences"
    },
    { 
      label: "Manage Roles", 
      href: "/payroll/roles", 
      icon: UserCheck,
      description: "User roles and permissions"
    },
  ],
  contractor: [
    { 
      label: "Dashboard", 
      href: "/contractor", 
      icon: LayoutDashboard,
      description: "Personal work overview"
    },
    { 
      label: "My Information", 
      href: "/contractor/information", 
      icon: UserCheck,
      description: "Update personal profile"
    },
    { 
      label: "Manage Onboarding", 
      href: "/contractor/onboarding", 
      icon: Briefcase,
      description: "Onboarding documents and tasks"
    },
    { 
      label: "Upload Time/Expenses", 
      href: "/contractor/time-expenses", 
      icon: Upload,
      description: "Submit timesheets and expenses"
    },
    { 
      label: "Manage Invoices", 
      href: "/contractor/invoices", 
      icon: Receipt,
      description: "View invoice status"
    },
    { 
      label: "My Remits", 
      href: "/contractor/remits", 
      icon: PieChart,
      description: "Payment history"
    },
    { 
      label: "Payslips", 
      href: "/contractor/payslips", 
      icon: FileText,
      description: "Download payslips"
    },
    { 
      label: "Refer a Friend", 
      href: "/contractor/refer", 
      icon: UserPlus,
      description: "Refer new contractors"
    },
  ],
}

// Get menu items for a specific role
export function getMenuForRole(roleName: string): MenuItem[] {
  return menuConfig[roleName] || []
}

// Check if user has access to a specific route
export function hasRouteAccess(roleName: string, route: string): boolean {
  const menu = getMenuForRole(roleName)
  return menu.some(item => route.startsWith(item.href))
}
