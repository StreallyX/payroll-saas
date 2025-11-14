"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileType, ListChecks, DollarSign, Layers, UserCog, Globe, ChevronRight, Palette } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsLinks = [
    {
      title: "White-Label Branding",
      description: "Customize logo and theme colors",
      icon: Palette,
      href: "/modules/settings/white-label",
      color: "text-pink-600 bg-pink-100"
    },
    {
      title: "Manage Users",
      description: "User accounts and permissions",
      icon: Users,
      href: "/modules/users",
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Document Types",
      description: "Configure document types",
      icon: FileType,
      href: "/modules/settings/document-types",
      color: "text-purple-600 bg-purple-100"
    },
    {
      title: "Master Onboarding",
      description: "Onboarding templates and workflows",
      icon: ListChecks,
      href: "/modules/settings/master-onboarding",
      color: "text-green-600 bg-green-100"
    },
    {
      title: "Payroll Partners",
      description: "Manage payroll service providers",
      icon: DollarSign,
      href: "/modules/payroll-partners",
      color: "text-orange-600 bg-orange-100"
    },
    {
      title: "Companies",
      description: "Company and organization management",
      icon: Layers,
      href: "/modules/settings/companies",
      color: "text-indigo-600 bg-indigo-100"
    },
    {
      title: "Roles",
      description: "User roles and permissions",
      icon: UserCog,
      href: "/modules/settings/roles",
      color: "text-red-600 bg-red-100"
    },
    {
      title: "Countries",
      description: "Country and region settings",
      icon: Globe,
      href: "/modules/settings/countries",
      color: "text-teal-600 bg-teal-100"
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure system-wide settings and preferences"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-lg mt-4">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto text-blue-600 hover:text-blue-700">
                    Configure →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
