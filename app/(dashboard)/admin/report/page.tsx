
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, FileText } from "lucide-react"

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const stats = [
    { label: "Total Revenue", value: "$2.4M", change: "+12.5%", icon: DollarSign, color: "text-green-600" },
    { label: "Active Users", value: "1,234", change: "+8.2%", icon: Users, color: "text-blue-600" },
    { label: "Contracts", value: "156", change: "+15.3%", icon: FileText, color: "text-purple-600" },
    { label: "Growth Rate", value: "23.4%", change: "+5.1%", icon: TrendingUp, color: "text-orange-600" }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="View comprehensive business reports and analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">{stat.change} vs last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-4">
        {/* Custom Tab Buttons */}
        <div className="grid w-full max-w-2xl grid-cols-4 gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "overview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "financial"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "operations"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab("hr")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "hr"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            HR
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader><CardTitle>Business Overview</CardTitle></CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-gray-500">
              Chart and analytics data will be displayed here
            </CardContent>
          </Card>
        )}

        {activeTab === "financial" && (
          <Card>
            <CardHeader><CardTitle>Financial Reports</CardTitle></CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-gray-500">
              Revenue, expenses, and profit analysis will be displayed here
            </CardContent>
          </Card>
        )}

        {activeTab === "operations" && (
          <Card>
            <CardHeader><CardTitle>Operations Reports</CardTitle></CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-gray-500">
              Contracts, projects, and performance metrics will be displayed here
            </CardContent>
          </Card>
        )}

        {activeTab === "hr" && (
          <Card>
            <CardHeader><CardTitle>HR Reports</CardTitle></CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-gray-500">
              Employee data, onboarding status, and workforce analytics will be displayed here
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
