
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoadingPage } from "@/components/ui/loading-spinner"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.replace("/login")
      return
    }

    // Redirect based on user role
    const roleName = session.user?.roleName
    switch (roleName) {
      case "admin":
        router.replace("/admin")
        break
      case "agency":
        router.replace("/agency")
        break
      case "payroll_partner":
        router.replace("/payroll")
        break
      case "contractor":
        router.replace("/contractor")
        break
      default:
        router.replace("/login")
    }
  }, [session, status, router])

  return <LoadingPage />
}
