"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard } from "@/components/shared/stats-card"
import { ChartWrapper, ChartSkeleton } from "@/components/shared/chart-wrapper"
import { Users, UserCheck, Clock, DollarSign, TrendingUp } from "lucide-react"
import { api } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function AgencyDashboardPage() {
  const router = useRouter()
  const [periodFilter, setPeriodFilter] = useState("month")

  const { data: metrics, isLoading: metricsLoading } =
    api.contractor.getDashboardMetrics.useQuery()

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Agency Portal"
          description="Manage your contractors and view key metrics"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Contractors",
      value: metrics?.totalContractors || 0,
      description: "Active contractors",
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      title: "Onboarding",
      value: metrics?.contractorsOnboarding || 0,
      description: "In progress",
      icon: UserCheck,
      iconColor: "text-yellow-600",
    },
    {
      title: "Pending Payments",
      value: metrics?.pendingPayments || 0,
      description: "Awaiting processing",
      icon: Clock,
      iconColor: "text-orange-600",
    },
    {
      title: "Revenue This Month",
      value: `$${(metrics?.revenueThisMonth || 0).toLocaleString()}`,
      description: "Total invoiced",
      icon: DollarSign,
      iconColor: "text-green-600",
    },
  ]

  // Mock data for charts (replace with real data from API)
  const contractorEvolutionData = metrics?.contractorEvolution || [
    { month: "Jan", count: 10 },
    { month: "Feb", count: 15 },
    { month: "Mar", count: 20 },
    { month: "Apr", count: 18 },
    { month: "May", count: 25 },
    { month: "Jun", count: 30 },
  ]

  const statusDistributionData = [
    { name: "Active", value: metrics?.totalContractors || 0, color: "#10b981" },
    { name: "Onboarding", value: metrics?.contractorsOnboarding || 0, color: "#f59e0b" },
    { name: "Inactive", value: metrics?.contractorsInactive || 0, color: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Agency Portal"
          description="Manage your contractors and view key metrics"
        />
        <Button onClick={() => router.push("/agency/contractors")}>
          View All Contractors
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contractor Evolution Chart */}
        <ChartWrapper
          title="Contractor Evolution"
          description="Growth over time"
          actions={
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={contractorEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Contractors"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Status Distribution Chart */}
        <ChartWrapper
          title="Status Distribution"
          description="Breakdown by status"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/agency/contractors")}
        >
          <Users className="h-6 w-6 mb-2" />
          Manage Contractors
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/documents")}
        >
          <TrendingUp className="h-6 w-6 mb-2" />
          Upload Documents
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/payments")}
        >
          <DollarSign className="h-6 w-6 mb-2" />
          View Payments
        </Button>
      </div>
    </div>
  )
}
