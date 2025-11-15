"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ListChecks } from "lucide-react"

export default function MasterOnboardingPage() {
  const templates = [
    { id: 1, name: "Contractor Onboarding", steps: 12, duration: "3-5 days", status: "active" },
    { id: 2, name: "Agency Onboarding", steps: 8, duration: "1-2 days", status: "active" },
    { id: 3, name: "Payroll Partner Onboarding", steps: 15, duration: "5-7 days", status: "active" }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Master Onboarding" description="Manage onboarding templates and workflows">
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Template</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">{template.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Steps</p>
                  <p className="font-semibold text-lg">{template.steps}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{template.duration}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 touch-manipulation">Edit</Button>
                <Button size="sm" className="flex-1 touch-manipulation">View Steps</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
