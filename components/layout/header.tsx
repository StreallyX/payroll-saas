"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, User, Settings, LogOut, ChevronDown, Building2, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title?: string
  description?: string
  onMobileMenuOpen?: () => void
}

export function Header({ title, description, onMobileMenuOpen }: HeaderProps) {
  const { data: session } = useSession() || {}
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-[hsl(var(--header-bg))] text-[hsl(var(--header-text))]">

      <Button variant="ghost" size="icon" onClick={onMobileMenuOpen} className="lg:hidden mr-2">
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1 min-w-0">
        {title && (
          <>
            <h1 className="text-lg lg:text-xl font-semibold truncate">{title}</h1>
            {description && (
              <p className="text-xs lg:text-sm opacity-70 truncate hidden sm:block">{description}</p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-medium">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs opacity-70 capitalize truncate">
                  {session?.user?.roleName?.replace("_", " ")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>

            {/* Company info for agency users */}
            {session?.user?.companyName && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.user.companyName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {session.user.companyRole || "Member"}
                        </span>
                        {session.user.isCompanyOwner && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            {/* Only show My Company for non-admin users who have a company */}
            {session?.user?.companyId &&
             !session?.user?.roleName?.toLowerCase().includes("admin") && (
              <DropdownMenuItem asChild>
                <Link href="/my-company" className="flex items-center cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>My Company</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
