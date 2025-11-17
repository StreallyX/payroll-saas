// MUST be at the TOP
export const config = {
  matcher: [
    "/((?!api/auth|api/auth|auth|api/trpc|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};



import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getFirstAccessibleRoute } from "@/lib/routing/dynamic-router";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const publicRoutes = [
      "/auth/login",
      "/auth/signin",
      "/auth/set-password",
    ];

    if (publicRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // 🔥 Must change password but token is NULL
    if (!token.isSuperAdmin && token.mustChangePassword) {
      if (!token.passwordResetToken) {
        // ⬅️ Redirect to API route that regenerates a token
        return NextResponse.redirect(
          new URL(`/api/auth/generate-reset-token?userId=${token.id}`, req.url)
        );
      }

      // Already has a token → go to set-password
      if (!pathname.startsWith("/auth/set-password")) {
        return NextResponse.redirect(
          new URL(`/auth/set-password?token=${token.passwordResetToken}`, req.url)
        );
      }
    }

    // SUPERADMIN isolation
    if (token.isSuperAdmin) {
      if (!pathname.startsWith("/superadmin")) {
        return NextResponse.redirect(new URL("/superadmin", req.url));
      }
      return NextResponse.next();
    }

    // DYNAMIC ROUTING based on permissions
    const permissions = (token.permissions as string[]) || [];
    
    // Redirect from root to first accessible route
    if (pathname === "/") {
      const firstRoute = getFirstAccessibleRoute(permissions);
      return NextResponse.redirect(new URL(firstRoute, req.url));
    }

    // Redirect from /dashboard to first accessible route if user has limited permissions
    if (pathname === "/home") {
      const firstRoute = getFirstAccessibleRoute(permissions);
      // Only redirect if dashboard is not the first accessible route
      // This allows users with many permissions to see the dashboard
      if (firstRoute !== "/home" && permissions.length > 0) {
        const hasSpecificModule = permissions.some(p => 
          !p.includes('.view') || p.split('.').length > 2
        );
        if (!hasSpecificModule) {
          return NextResponse.redirect(new URL(firstRoute, req.url));
        }
      }
    }

    // ====================================================================
    // PHASE 3: Route Redirections (Old routes → New functional routes)
    // ====================================================================
    // Comprehensive mapping from old role-based routes to new functional routes
    const ROUTE_REDIRECTS: Record<string, string> = {
      // ==================== CONTRACTOR ROUTES ====================
      "/contractor": "/dashboard",
      "/contractor/information": "/profile",
      "/contractor/my-onboarding": "/onboarding/my-onboarding",
      "/contractor/onboarding": "/onboarding/my-onboarding",
      "/contractor/payslips": "/payments/payslips",
      "/contractor/remits": "/payments/remits",
      "/contractor/refer": "/referrals",
      "/contractor/invoices": "/invoices",
      "/contractor/time-expenses": "/timesheets", // TODO: Split to /timesheets and /expenses
      "/contractor/timesheets": "/timesheets",
      "/contractor/expenses": "/expenses",
      
      // ==================== AGENCY ROUTES ====================
      "/agency": "/dashboard",
      "/agency/information": "/profile",
      "/agency/dashboard": "/dashboard",
      "/agency/contractors": "/team/contractors",
      "/agency/users": "/team/members",
      "/agency/invoices": "/invoices",
      "/agency/timesheets": "/timesheets",
      "/agency/expenses": "/expenses",
      "/agency/payslips": "/payments/payslips",
      "/agency/remits": "/payments/remits",
      "/agency/onboarding": "/onboarding/my-onboarding",
      
      // ==================== PAYROLL PARTNER ROUTES ====================
      "/payroll-partner": "/dashboard",
      "/payroll-partner/information": "/profile",
      "/payroll-partner/dashboard": "/dashboard",
      "/payroll-partner/contractors": "/team/contractors",
      "/payroll-partner/agencies": "/team/agencies",
      "/payroll-partner/invoices": "/invoices",
      "/payroll-partner/timesheets": "/timesheets",
      "/payroll-partner/expenses": "/expenses",
      "/payroll-partner/payslips": "/payments/payslips",
      "/payroll-partner/remits": "/payments/remits",
      "/payroll-partner/onboarding": "/onboarding/my-onboarding",
      
      // ==================== OLD MANAGEMENT ROUTES ====================
      "/contractors": "/team/contractors",
      "/agencies": "/team/agencies",
      "/payroll-partners": "/team/payroll-partners",
      "/users": "/team/members",
    };

    // Check if current pathname matches any old route (exact match or starts with)
    for (const [oldRoute, newRoute] of Object.entries(ROUTE_REDIRECTS)) {
      if (pathname === oldRoute || pathname.startsWith(oldRoute + "/")) {
        // Preserve query parameters and handle sub-paths
        const url = new URL(newRoute, req.url);
        url.search = req.nextUrl.search;
        
        // Handle sub-paths (e.g., /contractor/invoices/123 → /invoices/123)
        const subPath = pathname.slice(oldRoute.length);
        if (subPath && subPath !== "/" && !pathname.endsWith(oldRoute)) {
          url.pathname = newRoute + subPath;
        }
        
        return NextResponse.redirect(url);
      }
    }
    // ====================================================================

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);
