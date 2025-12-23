"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Menu, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions"

interface HeaderProps {
  title?: string
  description?: string
  onMobileMenuOpen?: () => void
}

export function Header({ title, description, onMobileMenuOpen }: HeaderProps) {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const { hasPermission } = usePermissions()

  // Check permission to create feature requests
  const CREATE_PERMISSION = buildPermissionKey(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN)
  const canCreateRequest = hasPermission(CREATE_PERMISSION)

  const handleFeatureRequest = () => {
    router.push("/feature-requests/new")
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
        {/* Feature Request Button */}
        {canCreateRequest && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFeatureRequest}
            className="hidden md:flex items-center gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Feature Request</span>
          </Button>
        )}

        {/* Mobile Feature Request Button */}
        {canCreateRequest && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFeatureRequest}
            className="md:hidden"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        )}

        {/* User Profile */}
        <div className="flex items-center space-x-2 px-3 border-l border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-medium">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs opacity-70 capitalize truncate">
              {session?.user?.roleName?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
