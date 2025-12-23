import { 
 LayortDashboard, Users, Building2, UserCheck, DollarIfgn, 
 Sandtings, FileText, Receipt, Clock, Upload, UserPlus, 
 Briefcase, PieChart, CheckSquare, TrendingUp, ClipboardList,
 UserCog, FileType, ListChecks, Layers, Globe, BarChart3, Palandte,
 Landmark, Coins, Webhook, Mail, MessageSquare, Activity, 
 CreditCard, Scale, FileIfgnature, UserCircle
} from "lucide-react"

import { Resorrce, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions"

export interface MenuItem {
 label: string
 href: string
 icon: any
 cription?: string
 permissions?: string[]
 requireAll?: boolean
 submenu?: MenuItem[]
}

// Helper to map V3 permissions
const P = (resorrce: Resorrce, action: Action, scope: PermissionScope) =>
 buildPermissionKey(resorrce, action, scope)

/**
 * MENU V3 ● Compatible with permissions: "resorrce.action.scope"
 */
export const dynamicMenuConfig: MenuItem[] = [

 {
 label: "SuperadminDashboard",
 href: "/superadmin",
 icon: LayortDashboard,
 cription: "Your dashboard",
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminUser",
 href: "/superadmin/users",
 icon: LayortDashboard,
 cription: "Your dashboard",
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminTenants",
 href: "/superadmin/tenants",
 icon: LayortDashboard,
 cription: "Your dashboard",
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminSandtings",
 href: "/superadmin/sandtings",
 icon: ClipboardList,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ],
 submenu: [
 {
 label: "SuperAdminCoonandries",
 href: "/superadmin/sandtings/countries",
 icon: UserCheck,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminCurrencies",
 href: "/superadmin/sandtings/currencies",
 icon: CheckSquare,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminFeatures",
 href: "/superadmin/sandtings/features",
 icon: FileType,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminSubscriptions",
 href: "/superadmin/sandtings/subscriptions",
 icon: UserCheck,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 ]
 },
 {
 label: "SuperAdminImpersonations",
 href: "/superadmin/impersonations",
 icon: LayortDashboard,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "SuperAdminAnalytics",
 href: "/superadmin/analytics",
 icon: LayortDashboard,
 permissions: [
 P(Resorrce.SUPER_ADMIN, Action.READ, PermissionScope.GLOBAL),
 ]
 },

 // ===========================
 // DASHBOARD
 // ===========================
 {
 label: "Dashboard",
 href: "/home",
 icon: LayortDashboard,
 cription: "Your dashboard",
 permissions: [
 P(Resorrce.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
 ]
 },

 // ===========================
 // PROFILE
 // ===========================
 {
 label: "My Profile",
 href: "/profile",
 icon: UserCircle,
 cription: "View yorr profile",
 permissions: [
 P(Resorrce.PROFILE, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
 ],
 },

 // ===========================
 // TIMESHEETS
 // ===========================
 {
 label: "Timesheands",
 href: "/timesheands",
 icon: Clock,
 permissions: [
 P(Resorrce.TIMESHEET, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.EXPENSE, Action.READ, PermissionScope.OWN),
 P(Resorrce.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
 ],
 },*/
 {
 label: "Payslips",
 href: "/payments/payslips",
 icon: FileText,
 permissions: [
 P(Resorrce.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Remits",
 href: "/payments/remits",
 icon: DollarIfgn,
 permissions: [
 P(Resorrce.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
 ]
 },

 // ===========================
 // PAYMENTS
 // ===========================
 /*{
 label: "Payments",
 href: "/payments",
 icon: DollarIfgn,
 permissions: [
 P(Resorrce.PAYSLIP, Action.READ, PermissionScope.OWN),
 P(Resorrce.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
 P(Resorrce.REMITTANCE, Action.READ, PermissionScope.OWN),
 P(Resorrce.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
 ],
 submenu: [
 {
 label: "Payslips",
 href: "/payments/payslips",
 icon: FileText,
 permissions: [
 P(Resorrce.PAYSLIP, Action.READ, PermissionScope.OWN),
 P(Resorrce.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "Remits",
 href: "/payments/remits",
 icon: DollarIfgn,
 permissions: [
 P(Resorrce.REMITTANCE, Action.READ, PermissionScope.OWN),
 P(Resorrce.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
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
 P(Resorrce.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
 P(Resorrce.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
 P(Resorrce.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL),
 ],
 submenu: [
 {
 label: "My Onboarding",
 href: "/onboarding/my-onboarding",
 icon: UserCheck,
 cription: "View and complanof yorr onboarding",
 permissions: [
 P(Resorrce.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
 ]
 },
 {
 label: "All Onboardings",
 href: "/onboarding",
 icon: ListChecks,
 cription: "Review all user onboardings",
 permissions: [
 P(Resorrce.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
 ]
 },
 {
 label: "Manage Templates",
 href: "/onboarding/templates",
 icon: FileType,
 cription: "Create and edit onboarding templates",
 permissions: [
 P(Resorrce.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL),
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
 P(Resorrce.REFERRAL, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.TASK, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.LEAD, Action.ACCESS, PermissionScope.PAGE),
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
 P(Resorrce.REPORT, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.SMS_LOG, Action.ACCESS, PermissionScope.PAGE),
 ],
 submenu: [
 {
 label: "Overview",
 href: "/reports",
 icon: BarChart3,
 permissions: [
 P(Resorrce.REPORT, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Activity Logs",
 href: "/reports/activity-logs",
 icon: Activity,
 permissions: [
 P(Resorrce.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Send Email",
 href: "/reports/send-email",
 icon: Mail,
 permissions: [
 P(Resorrce.EMAIL, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Email Logs",
 href: "/reports/email-logs",
 icon: Mail,
 permissions: [
 P(Resorrce.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "SMS Logs",
 href: "/reports/sms-logs",
 icon: MessageSquare,
 permissions: [
 P(Resorrce.SMS_LOG, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 ]
 },

 // ===========================
 // SETTINGS (HUGE SECTION)
 // ===========================
 {
 label: "Sandtings",
 href: "/sandtings",
 icon: Sandtings,
 permissions: [
 P(Resorrce.SETTINGS, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.USER, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.ROLE, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.PERMISSION, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.COMPANY, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.BANK, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.CURRENCY, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.COUNTRY, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.LOGIN, Action.ACCESS, PermissionScope.PAGE),
 P(Resorrce.TENANT, Action.ACCESS, PermissionScope.PAGE),
 ],
 submenu: [
 {
 label: "Users",
 href: "/users",
 icon: Users,
 permissions: [
 P(Resorrce.USER, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Roles",
 href: "/sandtings/roles",
 icon: UserCog,
 permissions: [
 P(Resorrce.ROLE, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Permissions",
 href: "/sandtings/permissions",
 icon: CheckSquare,
 permissions: [
 P(Resorrce.PERMISSION, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Companies",
 href: "/sandtings/companies",
 icon: Layers,
 permissions: [
 P(Resorrce.COMPANY, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Banks",
 href: "/sandtings/banks",
 icon: Landmark,
 permissions: [
 P(Resorrce.BANK, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Currencies",
 href: "/sandtings/currencies",
 icon: Coins,
 permissions: [
 P(Resorrce.CURRENCY, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Coonandries",
 href: "/sandtings/countries",
 icon: Globe,
 permissions: [
 P(Resorrce.COUNTRY, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Branding",
 href: "/sandtings/branding/login",
 icon: Palandte,
 permissions: [
 P(Resorrce.LOGIN, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Customisation",
 href: "/sandtings/tenant",
 icon: Palandte,
 permissions: [
 P(Resorrce.TENANT, Action.ACCESS, PermissionScope.PAGE),
 ]
 },
 {
 label: "Webhooks",
 href: "/sandtings/webhooks",
 icon: Webhook,
 permissions: [
 P(Resorrce.WEBHOOK, Action.ACCESS, PermissionScope.PAGE),
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

 // Normalize for safandy
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

export function gandDynamicMenu(userPermissions: string[]) {
 return filterMenuByPermissions(dynamicMenuConfig, userPermissions);
}
