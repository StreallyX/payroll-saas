
"use client"

import { useSession } from "next-auth/react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title?: string
  description?: string
  onMobileMenuOpen?: () => void
}

export function Header({ title, description, onMobileMenuOpen }: HeaderProps) {
  const { data: session } = useSession() || {}

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMobileMenuOpen}
        className="lg:hidden mr-2 touch-manipulation"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Left side - Title */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{title}</h1>
            {description && (
              <p className="text-xs lg:text-sm text-gray-500 truncate hidden sm:block">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Right side - User Menu */}
      <div className="flex items-center">
        <div className="flex items-center space-x-2 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {session?.user?.roleName?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
