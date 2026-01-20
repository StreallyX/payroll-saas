"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { getDynamicMenu } from "@/lib/dynamicMenuConfig"
import { useTenant } from "@/lib/hooks/useTenant"
import { api } from "@/lib/trpc"
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const { data: session } = useSession()
  const { tenant } = useTenant()
  const pathname = usePathname()

  // NEW: Check for pending contract actions
  const { data: actionsRequired } = api.contract.getUserActionsRequired.useQuery(
    undefined,
    { 
      enabled: !!session?.user,
      refetchInterval: 60000, // Refetch every minute
    }
  )

  useEffect(() => {
    if (onMobileClose) onMobileClose()
  }, [pathname])

  if (!session?.user) return null

  const userPermissions = session.user.permissions ?? []
  const isSuperAdmin = session.user.isSuperAdmin ?? false
  const menuItems = getDynamicMenu(userPermissions)

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  return (
    <TooltipProvider>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col",
          "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))]",
          "border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-64 lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "overflow-x-hidden max-w-full",
          "h-screen lg:h-full flex-shrink-0"  // Fix height
        )}
      >

        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0 bg-[hsl(var(--sidebar-bg))]">
          {!collapsed && (
            <div className="flex items-center space-x-2 min-w-0">
              {tenant?.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt="Logo"
                  className="h-8 max-w-[120px] object-contain"
                />
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
                    {tenant?.name?.[0] || "P"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{tenant?.name}</span>
                    <span className="text-xs opacity-70 truncate">{session.user.roleName}</span>
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

        {/* SCROLL MENU */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 sidebar-scroll">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isOpen = openSubmenus[item.label]
            
            // Check if this is the Contracts menu item and there are pending actions
            const isContractsMenu = item.href === "/contracts"
            const hasContractActions = isContractsMenu && actionsRequired?.hasActions

            return (
              <div key={index}>
                {!hasSubmenu ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors relative",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-[hsl(var(--sidebar-text)/0.08)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {hasContractActions && (
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                            {actionsRequired.total}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && hasContractActions && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500" />
                    )}
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
                          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
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
                            <span className="flex-1">{sub.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 border-t border-border p-3 bg-[hsl(var(--sidebar-bg))]">
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
            {collapsed && <TooltipContent side="right"><p>Sign out</p></TooltipContent>}
          </Tooltip>
        </div>

      </div>

    </TooltipProvider>
  )
}
