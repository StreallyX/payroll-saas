import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // 🔹 Exclure les routes publiques / API
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/signup") ||
      pathname.startsWith("/api/trpc")
    ) {
      return NextResponse.next()
    }

    // 🔹 Si pas connecté → redirige vers /login
    if (!token) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    const roleName = token.roleName as string
    const isSuperAdmin = token.isSuperAdmin as boolean

    // 🟥 SUPERADMIN — accès réservé
    if (isSuperAdmin) {
      // Redirige la racine vers /superadmin
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/superadmin", req.url))
      }

      // Autorise uniquement les routes /superadmin/*
      if (!pathname.startsWith("/superadmin")) {
        return NextResponse.redirect(new URL("/superadmin", req.url))
      }

      return NextResponse.next()
    }

    // 🟦 UTILISATEURS CLASSIQUES (tenant)
    if (pathname === "/") {
      switch (roleName) {
        case "admin":
          return NextResponse.redirect(new URL("/admin", req.url))
        case "agency":
          return NextResponse.redirect(new URL("/agency", req.url))
        case "payroll_partner":
          return NextResponse.redirect(new URL("/payroll", req.url))
        case "contractor":
          return NextResponse.redirect(new URL("/contractor", req.url))
        default:
          return NextResponse.redirect(new URL("/login", req.url))
      }
    }

    // 🧩 Protection par rôle (empêche accès croisé)
    const roleRoutes = {
      admin: "/admin",
      agency: "/agency",
      payroll_partner: "/payroll",
      contractor: "/contractor",
    }

    const userRoute = roleRoutes[roleName as keyof typeof roleRoutes]

    if (userRoute && !pathname.startsWith(userRoute)) {
      return NextResponse.redirect(new URL(userRoute, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Routes publiques / API
        if (
          pathname === "/login" ||
          pathname === "/register" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/signup") ||
          pathname.startsWith("/api/trpc")
        ) {
          return true
        }

        // Require auth for everything else
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // ✅ Inclure toutes les routes dynamiques SAUF les fichiers statiques
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",

    // ✅ Protection explicite du SuperAdmin
    "/superadmin/:path*",
  ],
}
