// MUST be at the VERY TOP before any import
export const config = {
  matcher: [
    "/((?!api/auth|auth|api/trpc|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 🔥 NEW PUBLIC ROUTES
    const publicRoutes = [
      "/auth/login",
      "/auth/signin",
      "/auth/set-password",
    ];

    if (publicRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // Not authenticated → redirect to /auth/login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Must change password before accessing the app
    if (!token.isSuperAdmin && token.mustChangePassword) {
      const resetToken = token.passwordResetToken;
      if (!pathname.startsWith("/auth/set-password")) {
        return NextResponse.redirect(
          new URL(`/auth/set-password?token=${resetToken}`, req.url)
        );
      }
    }

    // SuperAdmin isolation
    if (token.isSuperAdmin) {
      if (!pathname.startsWith("/superadmin")) {
        return NextResponse.redirect(new URL("/superadmin", req.url));
      }
      return NextResponse.next();
    }

    // RBAC: enforce homePath
    const homePath = token.homePath ?? "/dashboard";

    if (pathname === "/") {
      return NextResponse.redirect(new URL(homePath, req.url));
    }

    if (!pathname.startsWith(homePath)) {
      return NextResponse.redirect(new URL(homePath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);
