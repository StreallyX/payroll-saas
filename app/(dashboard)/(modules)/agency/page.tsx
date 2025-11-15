
"use client"

import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { api } from "@/lib/trpc"
import { Users, FileText, DollarSign, Clock, Building2, TrendingUp } from "lucide-react"

export default function AgencyDashboard() {
  const { data: session } = useSession() || {}

  // Mock data for agency dashboard
  const stats = [
    {
      title: "Active Contracts",
      value: "12",
      description: "Running contracts",
      icon: FileText,
      trend: { value: 8, label: "vs last month", isPositive: true }
    },
    {
      title: "Total Contractors",
      value: "34",
      description: "Assigned workers",
      icon: Users,
      trend: { value: 15, label: "vs last month", isPositive: true }
    },
    {
      title: "Pending Invoices",
      value: "$8,450",
      description: "Awaiting payment",
      icon: DollarSign,
      trend: { value: -5, label: "vs last month", isPositive: false }
    },
    {
      title: "This Month Revenue",
      value: "$28,500",
      description: "Current month",
      icon: TrendingUp,
      trend: { value: 22, label: "vs last month", isPositive: true }
    },
    {
      title: "Average Contract Duration",
      value: "4.2 months",
      description: "Typical length",
      icon: Clock,
    },
    {
      title: "Active Projects",
      value: "8",
      description: "Ongoing work",
      icon: Building2,
      trend: { value: 12, label: "vs last month", isPositive: true }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Dashboard"
        description="Manage your contracts, contractors, and invoices"
      />

      {/* Welcome Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-900">
              Welcome back, {session?.user?.name}!
            </h3>
            <p className="text-green-700">
              Overview of your agency operations and performance.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Contracts</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Web Development Project</p>
                <p className="text-sm text-gray-600">John Doe • Active</p>
              </div>
              <span className="text-sm text-green-600 font-medium">$5,200/month</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Marketing Campaign</p>
                <p className="text-sm text-gray-600">Jane Smith • Pending</p>
              </div>
              <span className="text-sm text-orange-600 font-medium">$3,800/month</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Data Analysis</p>
                <p className="text-sm text-gray-600">Mike Johnson • Completed</p>
              </div>
              <span className="text-sm text-gray-600 font-medium">$4,100/month</span>
            </div>
            {/* TODO: Load real contract data */}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Invoice #INV-001 Due</p>
                <p className="text-sm text-red-600">Due tomorrow</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Contract Review Meeting</p>
                <p className="text-sm text-orange-600">Due in 3 days</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Quarterly Report</p>
                <p className="text-sm text-blue-600">Due next week</p>
              </div>
            </div>
            {/* TODO: Load real deadline data */}
          </div>
        </div>
      </div>
    </div>
  )
}
