
"use client"

import { ReactNode, useEffect } from "react"
import { TenantContext } from "@/lib/hooks/useTenant"
import { api } from "@/lib/trpc"
import { useSession } from "next-auth/react"

// Helper function to convert hex color to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  // Parse hex values
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
  
  // Convert to degrees and percentages
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lVal = Math.round(l * 100)
  
  return `${h} ${s}% ${lVal}%`
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession() || {}
  
  const { data: tenant, isLoading, error, refetch } = api.tenant.getCurrent.useQuery(undefined, {
    enabled: status === "authenticated" && !!session?.user?.tenantId, // Only fetch when authenticated
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  })
  
  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Failed to load tenant settings:", error.message)
      console.error("Full error:", error)
    }
  }, [error])

  // Apply theme colors dynamically
  useEffect(() => {
    if (tenant?.primaryColor) {
      // Convert hex to HSL for Tailwind CSS variables
      const hsl = hexToHSL(tenant.primaryColor)
      document.documentElement.style.setProperty("--primary", hsl)
      document.documentElement.style.setProperty("--primary-color", tenant.primaryColor)
    }
    if (tenant?.accentColor) {
      const hsl = hexToHSL(tenant.accentColor)
      document.documentElement.style.setProperty("--accent", hsl)
      document.documentElement.style.setProperty("--accent-color", tenant.accentColor)
    }
  }, [tenant])

  // Even if loading or error, render children to avoid blocking the app
  return (
    <TenantContext.Provider value={{ tenant: tenant || null, isLoading: isLoading && !error, refetch }}>
      {children}
    </TenantContext.Provider>
  )
}
