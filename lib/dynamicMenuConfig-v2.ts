import { 
  LayoutDashboard, Users, Building2, UserCheck, DollarSign, 
  Settings, FileText, Receipt, Clock, Upload, UserPlus, 
  Briefcase, PieChart, CheckSquare, TrendingUp, ClipboardList,
  UserCog, FileType, ListChecks, Layers, Globe, BarChart3, Palette,
  Landmark, Coins, Webhook, Mail, MessageSquare, Activity, 
  CreditCard, Scale, FileSignature, UserCircle
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: any;
  description?: string;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  submenu?: MenuItem[];
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Dynamic menu configuration based on NEW permissions-v2
 * 
 * Migration Note:
 * - Uses granular permissions from permissions-v2.ts
 * - Replaces role-based paths with functional paths
 * - Supports adaptive permissions (view_own + manage.view_all)
 * 
 * Permission Patterns:
 * - *.view_own → User views their own data
 * - *.manage.view_all → Admin views all data
 * - *.create / *.update / *.delete → Specific actions
 */
export const dynamicMenuConfig: MenuItem[] = [
  { 
    label: "Dashboard", 
    href: "/dashboard", // Changed from /home
    icon: LayoutDashboard,
    description: "Your personalized dashboard",
    permission: "dashboard.view", // New permission
  },
  
  // 👤 PROFILE SECTION (All users)
  { 
    label: "My Profile", 
    href: "/profile", // Replaces /contractor/information, /agency/information, etc.
    icon: UserCircle,
    description: "View and edit your profile",
    permission: "profile.view",
  },
  
  // 📄 CONTRACTS SECTION (Adaptive)
  { 
    label: "Contracts", 
    href: "/contracts", // Unified path
    icon: FileText,
    description: "View and manage contracts",
    permissions: [
      "contracts.view_own",           // Contractor sees own contracts
      "contracts.manage.view_all"     // Admin sees all contracts
    ],
    requireAll: false,
  },
  
  // 🧾 INVOICES SECTION (Adaptive)
  { 
    label: "Invoices", 
    href: "/invoices",
    icon: Receipt,
    description: "View and manage invoices",
    permissions: [
      "invoices.view_own",           // Contractor sees own invoices
      "invoices.manage.view_all"     // Admin sees all invoices
    ],
    requireAll: false,
  },
  
  // ⏰ TIMESHEETS SECTION (Adaptive)
  { 
    label: "Timesheets", 
    href: "/timesheets",
    icon: Clock,
    description: "Log and manage timesheets",
    permissions: [
      "timesheets.view_own",         // Contractor sees own timesheets
      "timesheets.manage.view_all"   // Admin sees all timesheets
    ],
    requireAll: false,
  },
  
  // 💸 EXPENSES SECTION (Adaptive)
  { 
    label: "Expenses", 
    href: "/expenses",
    icon: Upload,
    description: "Submit and track expenses",
    permissions: [
      "expenses.view_own",           // Contractor sees own expenses
      "expenses.manage.view_all"     // Admin sees all expenses
    ],
    requireAll: false,
  },
  
  // 💰 PAYMENTS SECTION (Adaptive)
  { 
    label: "Payments", 
    href: "/payments",
    icon: DollarSign,
    description: "Payment history and payslips",
    permissions: [
      "payments.payslips.view_own",
      "payments.remits.view_own",
      "payments.payslips.view_all",
      "payments.remits.view_all",
    ],
    requireAll: false,
    submenu: [
      {
        label: "Payslips",
        href: "/payments/payslips", // Replaces /contractor/payslips
        icon: FileText,
        description: "View your payslips",
        permissions: [
          "payments.payslips.view_own",
          "payments.payslips.view_all"
        ],
        requireAll: false,
      },
      {
        label: "Remits",
        href: "/payments/remits", // Replaces /contractor/remits
        icon: DollarSign,
        description: "View payment history",
        permissions: [
          "payments.remits.view_own",
          "payments.remits.view_all"
        ],
        requireAll: false,
      },
    ]
  },
  
  // 📋 ONBOARDING SECTION (Adaptive)
  { 
    label: "Onboarding", 
    href: "/onboarding",
    icon: ClipboardList,
    description: "Onboarding processes",
    permissions: [
      "onboarding.responses.view_own",    // Contractor sees own onboarding
      "onboarding.responses.view_all",    // Admin sees all onboarding
      "onboarding.templates.view"         // Admin manages templates
    ],
    requireAll: false,
    submenu: [
      {
        label: "My Onboarding",
        href: "/onboarding/my-onboarding", // Replaces /contractor/onboarding
        icon: UserCheck,
        description: "Complete your onboarding",
        permission: "onboarding.responses.view_own",
      },
      {
        label: "Review Submissions",
        href: "/onboarding/review",
        icon: CheckSquare,
        description: "Review onboarding submissions",
        permission: "onboarding.responses.view_all",
      },
      {
        label: "Templates",
        href: "/onboarding/templates",
        icon: FileType,
        description: "Manage onboarding templates",
        permission: "onboarding.templates.view",
      },
    ]
  },
  
  // 🤝 REFERRALS SECTION
  { 
    label: "Referrals", 
    href: "/referrals", // Replaces /contractor/refer
    icon: UserPlus,
    description: "Refer colleagues and earn rewards",
    permissions: [
      "referrals.view",
      "referrals.manage.view_all"
    ],
    requireAll: false,
  },
  
  // ✅ TASKS SECTION
  { 
    label: "My Tasks", 
    href: "/tasks",
    icon: CheckSquare,
    description: "Your assigned tasks",
    permissions: [
      "tasks.view_own",
      "tasks.view_all"
    ],
    requireAll: false,
    badge: "3",
    badgeVariant: "default"
  },
  
  // 👥 TEAM MANAGEMENT (Admin only)
  { 
    label: "Team Management", 
    href: "/team",
    icon: Users,
    description: "Manage your team and contractors",
    permissions: [
      "contractors.manage.view_all",
      "agencies.manage.view_all",
      "team.view"
    ],
    requireAll: false,
    submenu: [
      {
        label: "Contractors",
        href: "/team/contractors", // Replaces /contractors
        icon: UserCheck,
        description: "Manage contractor profiles",
        permission: "contractors.manage.view_all",
      },
      {
        label: "Agencies",
        href: "/team/agencies", // Replaces /agencies
        icon: Building2,
        description: "Manage agency clients",
        permission: "agencies.manage.view_all",
      },
      {
        label: "Payroll Partners",
        href: "/team/payroll-partners", // Replaces /payroll-partners
        icon: DollarSign,
        description: "Manage payroll partners",
        permission: "payroll_partners.manage.view_all",
      },
      {
        label: "Team Members",
        href: "/team/members", // Replaces /agency/users
        icon: Users,
        description: "Manage your team members",
        permission: "team.view",
      },
    ]
  },
  
  // 🎯 LEADS SECTION
  { 
    label: "Leads", 
    href: "/leads",
    icon: TrendingUp,
    description: "Sales leads and prospects",
    permission: "leads.view"
  },
  
  // 📊 REPORTS SECTION
  { 
    label: "Reports", 
    href: "/reports",
    icon: BarChart3,
    description: "Analytics and reporting",
    permissions: [
      "reports.view",
      "reports.activity_logs",
      "reports.analytics"
    ],
    requireAll: false,
    submenu: [
      {
        label: "Overview",
        href: "/reports",
        icon: BarChart3,
        description: "Report overview",
        permission: "reports.view"
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: PieChart,
        description: "Business intelligence",
        permission: "reports.analytics"
      },
      {
        label: "Activity Logs",
        href: "/reports/activity-logs",
        icon: Activity,
        description: "Track user actions",
        permission: "reports.activity_logs"
      },
      {
        label: "User Activity",
        href: "/reports/user-activity",
        icon: UserCheck,
        description: "Monitor user behavior",
        permission: "reports.activity_logs"
      },
      {
        label: "Email Logs",
        href: "/reports/email-logs",
        icon: Mail,
        description: "Email tracking",
        permission: "reports.activity_logs"
      },
      {
        label: "SMS Logs",
        href: "/reports/sms-logs",
        icon: MessageSquare,
        description: "SMS tracking",
        permission: "reports.activity_logs"
      },
    ]
  },
  
  // ⚙️ SETTINGS SECTION
  { 
    label: "Settings", 
    href: "/settings",
    icon: Settings,
    description: "System configuration",
    permissions: [
      "settings.view",
      "tenant.view",
      "tenant.roles.view",
      "tenant.users.view"
    ],
    requireAll: false,
    submenu: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        description: "Manage user accounts",
        permission: "tenant.users.view"
      },
      {
        label: "Roles",
        href: "/settings/roles",
        icon: UserCog,
        description: "Manage roles and permissions",
        permission: "tenant.roles.view"
      },
      {
        label: "Permissions",
        href: "/settings/permissions",
        icon: CheckSquare,
        description: "View system permissions",
        permission: "tenant.roles.view"
      },
      {
        label: "Document Types",
        href: "/settings/document-types",
        icon: FileType,
        description: "Configure document types",
        permission: "document_types.view"
      },
      {
        label: "Master Onboarding",
        href: "/settings/master-onboarding",
        icon: ListChecks,
        description: "Onboarding workflows",
        permission: "tenant.onboarding.view"
      },
      {
        label: "Onboarding Templates",
        href: "/settings/onboarding-templates",
        icon: ClipboardList,
        description: "Configure templates",
        permission: "onboarding.templates.view"
      },
      {
        label: "Email Templates",
        href: "/settings/templates/email",
        icon: Mail,
        description: "Customize emails",
        permission: "tenant.templates.email.view"
      },
      {
        label: "PDF Templates",
        href: "/settings/templates/pdf",
        icon: FileSignature,
        description: "Customize PDFs",
        permission: "tenant.templates.pdf.view"
      },
      {
        label: "Webhooks",
        href: "/settings/webhooks",
        icon: Webhook,
        description: "Webhook integrations",
        permission: "webhooks.view"
      },
      {
        label: "Companies",
        href: "/settings/companies",
        icon: Layers,
        description: "Organization management",
        permission: "companies.view"
      },
      {
        label: "Banks",
        href: "/settings/banks",
        icon: Landmark,
        description: "Bank accounts",
        permission: "banks.view"
      },
      {
        label: "Currencies",
        href: "/settings/currencies",
        icon: Coins,
        description: "Currency settings",
        permission: "currencies.view"
      },
      {
        label: "Countries",
        href: "/settings/countries",
        icon: Globe,
        description: "Country settings",
        permission: "countries.view"
      },
      {
        label: "Tenant Settings",
        href: "/settings/tenant",
        icon: Palette,
        description: "Platform customization",
        permission: "tenant.view"
      },
      {
        label: "Branding",
        href: "/settings/branding/login",
        icon: Palette,
        description: "Login page branding",
        permission: "tenant.branding.update"
      },
      {
        label: "Subscription",
        href: "/settings/subscription",
        icon: CreditCard,
        description: "Manage subscription",
        permission: "tenant.subscription.view"
      },
      {
        label: "Legal",
        href: "/settings/legal",
        icon: Scale,
        description: "Legal documents",
        permission: "settings.view"
      }
    ]
  },
];

/**
 * CHANGELOG - Phase 2 Migration
 * 
 * 🔄 Path Changes:
 * - /home → /dashboard
 * - /contractor/* → /profile, /payments/*, /onboarding/my-onboarding, etc.
 * - /agency/* → /profile, /team/*, /settings/*
 * - /payroll-partner/* → /profile, /team/*, /settings/*
 * - /contractors → /team/contractors
 * - /agencies → /team/agencies
 * - /payroll-partners → /team/payroll-partners
 * 
 * 🔐 Permission Changes:
 * - contractors.view → contractors.view_own + contractors.manage.view_all
 * - invoices.view → invoices.view_own + invoices.manage.view_all
 * - timesheets.* → timesheets.view_own + timesheets.manage.view_all
 * - expenses.* → expenses.view_own + expenses.manage.view_all
 * - contracts.view → contracts.view_own + contracts.manage.view_all
 * 
 * ✨ New Permissions:
 * - dashboard.view
 * - profile.view / profile.update
 * - payments.payslips.view_own / view_all
 * - payments.remits.view_own / view_all
 * - team.view / team.manage
 * - reports.view / reports.analytics / reports.activity_logs
 * 
 * 🎯 Benefits:
 * - Functional organization (not role-based)
 * - Adaptive content based on permissions
 * - No code duplication
 * - Easy to add new roles
 * - Clear permission hierarchy
 */
