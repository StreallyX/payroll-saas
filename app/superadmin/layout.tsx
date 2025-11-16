"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  LogOut, 
  LayoutDashboard, 
  Building2,
  Users,
  BarChart3,
  FileText,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useState } from "react"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/superadmin/settings")
  )

  if (status === "loading") return <LoadingPage />
  if (!session?.user?.isSuperAdmin) return null

  const getTitle = () => {
    if (pathname === "/superadmin") return "SuperAdmin Dashboard"
    if (pathname.startsWith("/superadmin/tenants")) return "Tenant Management"
    if (pathname.startsWith("/superadmin/users")) return "User Management"
    if (pathname.startsWith("/superadmin/analytics")) return "Global Analytics"
    if (pathname.startsWith("/superadmin/logs")) return "System Logs"
    if (pathname.startsWith("/superadmin/impersonations")) return "Impersonations"
    if (pathname.startsWith("/superadmin/settings")) return "Settings"
    return "SuperAdmin Panel"
  }

  const navItems = [
    {
      href: "/superadmin",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
    },
    {
      href: "/superadmin/tenants",
      icon: Building2,
      label: "Tenants",
    },
    {
      href: "/superadmin/users",
      icon: Users,
      label: "Users",
    },
    {
      href: "/superadmin/analytics",
      icon: BarChart3,
      label: "Analytics",
    },
    {
      href: "/superadmin/logs",
      icon: FileText,
      label: "System Logs",
    },
    {
      href: "/superadmin/impersonations",
      icon: UserCog,
      label: "Impersonations",
    },
  ]

  const settingsItems = [
    {
      href: "/superadmin/settings/currencies",
      label: "Currencies",
    },
    {
      href: "/superadmin/settings/countries",
      label: "Countries",
    },
    {
      href: "/superadmin/settings/features",
      label: "Feature Flags",
    },
    {
      href: "/superadmin/settings/subscriptions",
      label: "Subscriptions",
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">SuperAdmin Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Global Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "hover:bg-slate-800/70 text-slate-300"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Settings Submenu */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={cn(
                "w-full flex items-center justify-between space-x-3 px-3 py-2 rounded-lg transition",
                pathname.startsWith("/superadmin/settings")
                  ? "bg-slate-800 text-white"
                  : "hover:bg-slate-800/70 text-slate-300"
              )}
            >
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
              {settingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {settingsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {settingsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 rounded-lg text-sm transition",
                      pathname === item.href
                        ? "bg-slate-800 text-white"
                        : "hover:bg-slate-800/70 text-slate-300"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
