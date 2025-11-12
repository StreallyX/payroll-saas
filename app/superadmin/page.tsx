"use client"

import { useSession } from "next-auth/react"
import { api } from "@/lib/trpc"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingState } from "@/components/shared/loading-state"
import { Building2, CheckCircle, Users, FileText, Activity } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function SuperAdminDashboard() {
  const { data: session } = useSession()
  const { data: tenants, isLoading } = api.tenant.getAllForSuperAdmin.useQuery()

  if (isLoading) return <LoadingState message="Loading SuperAdmin Dashboard..." />

  // Calculs
  const totalTenants = tenants?.length || 0
  const activeTenants = tenants?.filter((t) => t.isActive).length || 0
  const totalUsers = tenants?.reduce((sum, t) => sum + (t.userCount || 0), 0) || 0
  const totalContracts = tenants?.reduce((sum, t) => sum + (t.contractCount || 0), 0) || 0

  const stats = [
    {
      title: "Total Tenants",
      value: totalTenants.toString(),
      description: "All registered organizations",
      icon: Building2,
    },
    {
      title: "Active Tenants",
      value: activeTenants.toString(),
      description: "Currently active clients",
      icon: CheckCircle,
    },
    {
      title: "Total Users",
      value: totalUsers.toString(),
      description: "Users across all tenants",
      icon: Users,
    },
    {
      title: "Total Contracts",
      value: totalContracts.toString(),
      description: "Contracts across all tenants",
      icon: FileText,
    },
  ]

  const recentTenants = tenants?.slice(0, 5) || []

  return (
    <div className="space-y-8">
      <PageHeader
        title="SuperAdmin Dashboard"
        description="Global overview of all tenants, users, and activities"
      />

      {/* Welcome box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Welcome back, {session?.user?.name || "SuperAdmin"}!
            </h3>
            <p className="text-blue-700">
              Here’s an overview of the entire platform activity.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Recent Tenants */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Tenants
        </h3>

        {recentTenants.length === 0 ? (
          <p className="text-gray-500 text-sm">No tenants found.</p>
        ) : (
          <table className="w-full text-sm text-left border-t border-gray-100">
            <thead className="text-gray-600 uppercase text-xs bg-gray-50">
              <tr>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Contracts</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tenant.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tenant.userCount}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {tenant.contractCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        tenant.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tenant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
