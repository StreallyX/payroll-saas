
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { getMenuForRole, MenuItem } from "@/lib/menuConfig"
import { useTenant } from "@/lib/hooks/useTenant"
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Settings,
  User,
  X,
  Menu,
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

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose()
    }
  }, [pathname])

  if (!session?.user?.roleName) {
    return null
  }

  const menuItems = getMenuForRole(session.user.roleName)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const renderMenuItem = (item: MenuItem, index: number) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openSubmenus[item.label]

    return (
      <div key={index}>
        {!hasSubmenu ? (
          <Link
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mx-2 touch-manipulation",
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </Link>
        ) : (
          <div>
            <button
              onClick={() => toggleSubmenu(item.label)}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg mx-2 touch-manipulation",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isSubmenuOpen && "rotate-180"
                  )}
                />
              )}
            </button>
            {!collapsed && isSubmenuOpen && item.submenu && (
              <div className="ml-8 mt-1 space-y-1">
                {item.submenu.map((subItem, subIndex) => {
                  const isSubActive = pathname === subItem.href
                  return (
                    <Link
                      key={subIndex}
                      href={subItem.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2 text-sm transition-colors rounded-lg touch-manipulation",
                        isSubActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <subItem.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{subItem.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <TooltipProvider>
        <div 
          className={cn(
            "fixed lg:relative inset-y-0 left-0 z-50 flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300",
            collapsed ? "w-16" : "w-64 lg:w-64",
            // Mobile: hidden by default, show when mobileOpen is true
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {tenant?.logoUrl ? (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name || "Company Logo"} 
                  className="h-8 w-auto object-contain flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div 
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-semibold flex-shrink-0",
                  tenant?.logoUrl && "hidden"
                )}
              >
                {tenant?.name?.[0] || "P"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {tenant?.name || "Payroll SaaS"}
                </span>
                <span className="text-xs text-gray-500 capitalize truncate">
                  {session.user.roleName?.replace("_", " ")}
                </span>
              </div>
            </div>
          )}
          
          {/* Desktop: Collapse button, Mobile: Close button */}
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
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
          {menuItems?.map?.((item, index) => renderMenuItem(item, index))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3">
          {!collapsed && (
            <div className="px-2 py-3 mb-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className={cn("flex gap-1", collapsed ? "flex-col" : "")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSignOut}
                  className={cn(
                    "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
                  {!collapsed && "Sign out"}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>Sign out</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
    </>
  )
}
