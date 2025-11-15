
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { TenantProvider } from "@/components/providers/tenant-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/login")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return <LoadingPage />
  }

  if (!session) {
    return null
  }

  return (
    <TenantProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header 
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TenantProvider>
  )
}
