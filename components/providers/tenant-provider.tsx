"use client"

import { ReactNode, useEffect } from "react"
import { TenantContext } from "@/lib/hooks/useTenant"
import { api } from "@/lib/trpc"
import { useSession } from "next-auth/react"

// Helper function to convert hex color to HSL
function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lVal = Math.round(l * 100)
  return `${h} ${s}% ${lVal}%`
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession() || {}

  const { data: tenant, isLoading, error, refetch } = api.tenant.getCurrent.useQuery(undefined, {
    enabled: status === "authenticated" && !!session?.user?.tenantId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (error) {
      console.error("Failed to load tenant settings:", error.message)
      console.error("Full error:", error)
    }
  }, [error])

  // ✅ APPLY DYNAMIC THEME COLORS (NOW INCLUDING BACKGROUND)
  useEffect(() => {
  if (!tenant) return
  
  // Primary
  if (tenant.primaryColor) {
    const hsl = hexToHSL(tenant.primaryColor)
    document.documentElement.style.setProperty("--primary", hsl)
  }

  // Accent
  if (tenant.accentColor) {
    const hsl = hexToHSL(tenant.accentColor)
    document.documentElement.style.setProperty("--accent", hsl)
  }

  // ✅ Background
  if (tenant.backgroundColor) {
    const hsl = hexToHSL(tenant.backgroundColor)
    document.documentElement.style.setProperty("--background", hsl)
  }

  // SIDEBAR BG
  if (tenant.sidebarBgColor) {
    const hsl = hexToHSL(tenant.sidebarBgColor)
    document.documentElement.style.setProperty("--sidebar-bg", hsl)
  }

  // SIDEBAR TEXT
  if (tenant.sidebarTextColor) {
    const hsl = hexToHSL(tenant.sidebarTextColor)
    document.documentElement.style.setProperty("--sidebar-text", hsl)
  }

  // HEADER BG
  if (tenant.headerBgColor) {
    const hsl = hexToHSL(tenant.headerBgColor)
    document.documentElement.style.setProperty("--header-bg", hsl)
  }

  // HEADER TEXT
  if (tenant.headerTextColor) {
    const hsl = hexToHSL(tenant.headerTextColor)
    document.documentElement.style.setProperty("--header-text", hsl)
  }

}, [tenant])


  return (
    <TenantContext.Provider value={{ tenant: tenant || null, isLoading: isLoading && !error, refetch }}>
      {children}
    </TenantContext.Provider>
  )
}
