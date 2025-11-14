// MUST be at the TOP
export const config = {
  matcher: [
    "/((?!api/auth|api/auth|auth|api/trpc|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};



import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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

    // NORMAL USER HOME PATH
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
