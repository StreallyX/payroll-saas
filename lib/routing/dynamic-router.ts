
import { PERMISSION_TREE } from "@/server/rbac/permissions";

// Définition des routes avec leurs permissions requises
export const ROUTES_CONFIG = [
  // Dashboard
  { path: "/home", permission: null, label: "Dashboard", icon: "LayoutDashboard" },
  
  // Users & Teams
  { path: "/modules/users", permission: PERMISSION_TREE.tenant.users.view, label: "Users", icon: "Users", category: "Team" },
  { path: "/modules/settings/roles", permission: PERMISSION_TREE.tenant.roles.view, label: "Roles & Permissions", icon: "UserCog", category: "Team" },
  
  // Contractors
  { path: "/modules/contractors", permission: PERMISSION_TREE.contractors.view, label: "Contractors", icon: "UserCheck", category: "Workforce" },
  
  // Agencies
  { path: "/modules/agencies", permission: PERMISSION_TREE.agencies.view, label: "Agencies", icon: "Building2", category: "Partners" },
  
  // Contracts
  { path: "/modules/contracts", permission: PERMISSION_TREE.contracts.view, label: "Contracts", icon: "FileText", category: "Operations" },
  
  // Invoices
  { path: "/modules/invoices", permission: PERMISSION_TREE.invoices.view, label: "Invoices", icon: "Receipt", category: "Finance" },
  
  // Payroll
  { path: "/modules/payroll", permission: PERMISSION_TREE.payroll.view, label: "Payroll", icon: "DollarSign", category: "Finance" },
  
  // Payslips
  { path: "/modules/payslips", permission: PERMISSION_TREE.payslip.view, label: "Payslips", icon: "FileText", category: "Finance" },
  
  // Onboarding
  { path: "/modules/onboarding", permission: PERMISSION_TREE.onboarding.templates.view, label: "Onboarding", icon: "ClipboardList", category: "HR" },
  
  // Tasks
  { path: "/modules/tasks", permission: PERMISSION_TREE.tasks.view, label: "Tasks", icon: "CheckSquare", category: "Productivity" },
  
  // Leads
  { path: "/modules/leads", permission: PERMISSION_TREE.leads.view, label: "Leads", icon: "TrendingUp", category: "Sales" },
  
  // Reports
  { path: "/modules/reports", permission: PERMISSION_TREE.audit.view, label: "Reports", icon: "BarChart3", category: "Analytics" },
  { path: "/modules/reports/activity-logs", permission: PERMISSION_TREE.audit.view, label: "Activity Logs", icon: "ListChecks", category: "Analytics" },
  
  // Settings
  { path: "/modules/settings", permission: PERMISSION_TREE.settings.view, label: "Settings", icon: "Settings", category: "System" },
  { path: "/modules/settings/tenant", permission: PERMISSION_TREE.tenant.view, label: "Tenant Settings", icon: "Building", category: "System" },
];

/**
 * Obtenir la première route accessible pour un utilisateur
 */
export function getFirstAccessibleRoute(permissions: string[]): string {
  // Si pas de permissions, rediriger vers dashboard
  if (!permissions || permissions.length === 0) {
    return "/home";
  }

  // Trouver la première route accessible
  for (const route of ROUTES_CONFIG) {
    if (!route.permission || permissions.includes(route.permission)) {
      return route.path;
    }
  }

  // Par défaut, dashboard
  return "/home";
}

/**
 * Obtenir toutes les routes accessibles pour un utilisateur
 */
export function getAccessibleRoutes(permissions: string[]) {
  return ROUTES_CONFIG.filter(route =>
    !route.permission || permissions.includes(route.permission)
  );
}

/**
 * Vérifier si un utilisateur a accès à une route
 */
export function canAccessRoute(path: string, permissions: string[]): boolean {
  const route = ROUTES_CONFIG.find(r => path.startsWith(r.path));
  if (!route) return false;
  if (!route.permission) return true;
  return permissions.includes(route.permission);
}

/**
 * Grouper les routes par catégorie
 */
export function getRoutesByCategory(permissions: string[]) {
  const accessibleRoutes = getAccessibleRoutes(permissions);
  const grouped: Record<string, typeof ROUTES_CONFIG> = {};

  accessibleRoutes.forEach(route => {
    const category = route.category || "Other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(route);
  });

  return grouped;
}
