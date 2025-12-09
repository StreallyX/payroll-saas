
"use client"

import { createContext, useContext } from "react"

export interface TenantSettings {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  backgroundColor: string | null
  sidebarBgColor: string | null
  sidebarTextColor: string | null
  headerBgColor: string | null
  headerTextColor: string | null
  customFont: string | null
}

interface TenantContextType {
  tenant: TenantSettings | null
  isLoading: boolean
  refetch: () => void
}

export const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  refetch: () => {},
})

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider")
  }
  return context
}
