
"use client"

import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingState } from "@/components/shared/loading-state"
import { api } from "@/lib/trpc"
import { Users, Building2, UserCheck, DollarSign, FileText, TrendingUp } from "lucide-react"

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function AdminDashboard() {
  const { data: session } = useSession() || {}

  // Fetch real stats
  const { data: agencyStats, isLoading: loadingAgencies } = api.agency.getStats.useQuery()
  const { data: contractStats, isLoading: loadingContracts } = api.contract.getStats.useQuery()
  const { data: auditStats, isLoading: loadingAudit } = api.auditLog.getStats.useQuery()
  
  const isLoading = loadingAgencies || loadingContracts || loadingAudit

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  // Real stats data
  const stats = [
    {
      title: "Total Agencies",
      value: agencyStats?.total?.toString() || "0",
      description: "All registered agencies",
      icon: Building2,
    },
    {
      title: "Active Agencies",
      value: agencyStats?.active?.toString() || "0",
      description: "Currently active",
      icon: Building2,
    },
    {
      title: "Inactive Agencies",
      value: agencyStats?.inactive?.toString() || "0",
      description: "Not currently active",
      icon: Building2,
    },
    {
      title: "Total Contracts",
      value: contractStats?.total?.toString() || "0",
      description: "All contracts",
      icon: FileText,
    },
    {
      title: "Active Contracts",
      value: contractStats?.active?.toString() || "0",
      description: "Currently running",
      icon: FileText,
    },
    {
      title: "Draft Contracts",
      value: contractStats?.draft?.toString() || "0",
      description: "Pending activation",
      icon: FileText,
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and management tools"
      />

      {/* Welcome Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Welcome back, {session?.user?.name}!
            </h3>
            <p className="text-blue-700">
              Here&apos;s what&apos;s happening with your platform today.
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
          />
        ))}
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {auditStats?.recentActivity && auditStats.recentActivity.length > 0 ? (
              auditStats.recentActivity.slice(0, 5).map((log: any) => {
                const actionColor = 
                  log.action === "CREATE" ? "bg-green-500" :
                  log.action === "UPDATE" ? "bg-blue-500" :
                  log.action === "DELETE" ? "bg-red-500" : "bg-gray-500"
                
                const timeAgo = getTimeAgo(new Date(log.createdAt))
                
                return (
                  <div key={log.id} className="flex items-center space-x-3 text-sm">
                    <div className={`w-2 h-2 ${actionColor} rounded-full flex-shrink-0`}></div>
                    <span className="text-gray-600 flex-1 truncate">{log.description}</span>
                    <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo}</span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Status</span>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Agencies</span>
              <span className="text-sm text-blue-600 font-medium">{agencyStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Contracts</span>
              <span className="text-sm text-blue-600 font-medium">{contractStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Activities</span>
              <span className="text-sm text-green-600 font-medium">{auditStats?.totalLogs || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
