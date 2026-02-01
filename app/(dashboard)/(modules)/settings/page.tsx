"use client"

import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RouteGuard } from "@/components/guards/RouteGuard"
import { Construction, Settings as SettingsIcon, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.roleName?.toLowerCase() === "admin" ||
                  session?.user?.roleName?.toLowerCase() === "super_admin" ||
                  session?.user?.isSuperAdmin

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="System configuration"
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-medium text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Settings are only accessible to administrators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RouteGuard permission="settings.access.page">
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure system-wide settings and preferences"
        />

        <Alert className="border-yellow-200 bg-yellow-50">
          <Construction className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Under Construction</AlertTitle>
          <AlertDescription className="text-yellow-700">
            The settings page is currently being rebuilt. Please check back later for the new configuration options.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gray-100">
                <SettingsIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Advanced configuration options will be available here soon.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Construction className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Coming Soon</p>
              <p className="text-sm max-w-md mx-auto">
                We're working on a new settings experience. In the meantime, you can access specific settings through the sidebar menu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  )
}
