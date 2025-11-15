
"use client"

import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { UserCheck, FileText, DollarSign, Clock, Upload, CheckCircle } from "lucide-react"

export default function ContractorDashboard() {
  const { data: session } = useSession() || {}

  const stats = [
    {
      title: "Active Contracts",
      value: "3",
      description: "Current assignments",
      icon: FileText,
    },
    {
      title: "This Month Earnings",
      value: "$8,450",
      description: "Pending payment",
      icon: DollarSign,
      trend: { value: 15, label: "vs last month", isPositive: true }
    },
    {
      title: "Hours This Week",
      value: "32.5",
      description: "Logged hours",
      icon: Clock,
    },
    {
      title: "Pending Timesheets",
      value: "2",
      description: "Need submission",
      icon: Upload,
    },
    {
      title: "Completed Projects",
      value: "12",
      description: "All time",
      icon: CheckCircle,
      trend: { value: 8, label: "vs last month", isPositive: true }
    },
    {
      title: "Profile Status",
      value: "Complete",
      description: "Documentation ready",
      icon: UserCheck,
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor Dashboard"
        description="Manage your work, timesheets, and payments"
      />

      {/* Welcome Message */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <UserCheck className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-purple-900">
              Welcome back, {session?.user?.name}!
            </h3>
            <p className="text-purple-700">
              Track your work progress and manage your assignments.
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

      {/* Work Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-gray-900">Frontend Development</p>
                <p className="text-sm text-gray-600">Acme Corp • Due Dec 15</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-gray-900">API Integration</p>
                <p className="text-sm text-gray-600">Tech Solutions • Due Dec 20</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="font-medium text-gray-900">Database Migration</p>
                <p className="text-sm text-gray-600">StartupXYZ • Due Jan 5</p>
              </div>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                Pending
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Timesheet submitted for Week 48</span>
              <span className="text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Invoice #INV-2024-089 generated</span>
              <span className="text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Profile updated</span>
              <span className="text-gray-400">3 days ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">New contract assignment received</span>
              <span className="text-gray-400">5 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
