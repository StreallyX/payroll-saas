"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { getDynamicMenu, MenuItem } from "@/lib/dynamicMenuConfig"
import { useTenant } from "@/lib/hooks/useTenant"
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  User,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const { data: session } = useSession() || {}
  const { tenant } = useTenant()
  const pathname = usePathname()

  useEffect(() => {
    if (onMobileClose) onMobileClose()
  }, [pathname])

  if (!session?.user) return null

  // Get dynamic menu based on user permissions
  const userPermissions = session.user.permissions || []
  const isSuperAdmin = session.user.isSuperAdmin || false
  const menuItems = getDynamicMenu(userPermissions, isSuperAdmin)

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <TooltipProvider>
        <div 
          className={cn(
            "fixed lg:relative inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border transition-all duration-300",
            "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))]",
            collapsed ? "w-16" : "w-64 lg:w-64",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >

          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              
              {tenant?.logoUrl ? (
                // ✅ Logo only (no text)
                <img 
                  src={tenant.logoUrl}
                  alt={tenant.name || "Company Logo"} 
                  className="h-8 max-w-[120px] object-contain flex-shrink-0"
                />
              ) : (
                // ✅ Fallback small icon + name
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
                    {tenant?.name?.[0] || "P"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {tenant?.name || "Payroll SaaS"}
                    </span>
                    <span className="text-xs opacity-70 truncate">
                      {session.user.roleName?.replace("_", " ")}
                    </span>
                  </div>
                </>
              )}

            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileClose}
              className="h-8 w-8 p-0 lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex h-8 w-8 p-0"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>


          {/* Navigation */}
          <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
            {menuItems?.map?.((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const hasSubmenu = item.submenu?.length
              const isOpen = openSubmenus[item.label]

              return (
                <div key={index}>
                  {!hasSubmenu ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors",
                        isActive 
                          ? "bg-primary/15 text-primary" 
                          : "hover:bg-[hsl(var(--sidebar-text)/0.08)]"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg mx-2 hover:bg-[hsl(var(--sidebar-text)/0.08)]"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5" />
                          {!collapsed && <span>{item.label}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </button>

                      {!collapsed && isOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu?.map((sub, i) => (
                            <Link
                              key={i}
                              href={sub.href}
                              className={cn(
                                "flex items-center space-x-3 px-4 py-2 text-sm rounded-lg hover:bg-[hsl(var(--sidebar-text)/0.08)]",
                                pathname === sub.href && "bg-primary/15 text-primary"
                              )}
                            >
                              <sub.icon className="h-4 w-4" />
                              <span>{sub.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className={cn(
                    "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
                  {!collapsed && "Sign out"}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right"><p>Sign out</p></TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </>
  )
}
