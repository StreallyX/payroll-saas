"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LogOut, LayoutDashboard, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LoadingPage } from "@/components/ui/loading-spinner"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === "loading") return <LoadingPage />
  if (!session?.user?.isSuperAdmin) return null

  const getTitle = () => {
    if (pathname === "/superadmin") return "SuperAdmin Dashboard"
    if (pathname.startsWith("/superadmin/tenants")) return "Tenant Management"
    return "SuperAdmin Panel"
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">SuperAdmin Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Global Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/superadmin"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition",
              pathname === "/superadmin"
                ? "bg-slate-800 text-white"
                : "hover:bg-slate-800/70 text-slate-300"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/superadmin/tenants"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition",
              pathname.startsWith("/superadmin/tenants")
                ? "bg-slate-800 text-white"
                : "hover:bg-slate-800/70 text-slate-300"
            )}
          >
            <Building2 className="h-5 w-5" />
            <span>Tenants</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-sm text-slate-400 mb-2 truncate">
            {session?.user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full text-slate-300 hover:bg-slate-800"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
          <div className="text-sm text-gray-600">
            {session?.user?.name || "SuperAdmin"}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
