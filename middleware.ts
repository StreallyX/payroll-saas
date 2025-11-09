
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Public paths and API routes that don't require middleware processing
    if (
      pathname === "/login" || 
      pathname === "/register" || 
      pathname.startsWith("/api/auth") || 
      pathname.startsWith("/api/signup") ||
      pathname.startsWith("/api/trpc")  // Exclude tRPC API calls from middleware
    ) {
      return NextResponse.next()
    }

    // If user is not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const roleName = token.roleName as string

    // Role-based redirects for root path
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

    // Role-based route protection
    const roleRoutes = {
      admin: "/admin",
      agency: "/agency", 
      payroll_partner: "/payroll",
      contractor: "/contractor"
    }

    const userRoute = roleRoutes[roleName as keyof typeof roleRoutes]
    
    // Check if user is accessing the correct route for their role
    if (userRoute && !pathname.startsWith(userRoute)) {
      return NextResponse.redirect(new URL(userRoute, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public paths and API routes
        if (
          pathname === "/login" || 
          pathname === "/register" || 
          pathname.startsWith("/api/auth") || 
          pathname.startsWith("/api/signup") ||
          pathname.startsWith("/api/trpc")  // Allow tRPC API calls
        ) {
          return true
        }
        
        // Require token for all other paths
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
}
