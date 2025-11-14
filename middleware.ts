import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 📌 Routes publiques
    const publicPaths = ["/login", "/register", "/auth/set-password"];
    if (publicPaths.includes(pathname)) return NextResponse.next();

    // 📌 Si pas loggé → login
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    // 🔥 MUST CHANGE PASSWORD → redirection forcée
    if (!token.isSuperAdmin && token.mustChangePassword && !pathname.startsWith("/auth/set-password")) {
      return NextResponse.redirect(new URL("/auth/set-password", req.url));
    }

    // 🔥 SUPERADMIN ISOLÉ
    if (token.isSuperAdmin) {
      if (!pathname.startsWith("/superadmin")) {
        return NextResponse.redirect(new URL("/superadmin", req.url));
      }
      return NextResponse.next();
    }

    // 🔥 RBAC DYNAMIQUE : HOME PATH venant de Prisma
    const homePath = token.homePath as string;

    // Si l’utilisateur va sur "/" → redirect vers sa home dynamique
    if (pathname === "/") {
      return NextResponse.redirect(new URL(homePath, req.url));
    }

    // 🔥 Protection des sections : un rôle ne peut sortir de sa zone
    if (!pathname.startsWith(homePath)) {
      return NextResponse.redirect(new URL(homePath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};
