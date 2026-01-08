"use client"

import { useSession } from "next-auth/react"
import { useMemo } from "react"

export function usePermissions() {
  const { data: session, status } = useSession()

  const permissions = useMemo(() => {
    return session?.user?.permissions || []
  }, [session])

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p))
  }

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(p => permissions.includes(p))
  }

  const isSuperAdmin = session?.user?.isSuperAdmin || false

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    /**
     * ❗ CORRECT: we use status to know if it's loading
     */
    isLoading: status === "loading"
  }
}
