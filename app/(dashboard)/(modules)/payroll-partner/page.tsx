"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard } from "@/components/shared/stats-card"
import { ChartWrapper, ChartSkeleton } from "@/components/shared/chart-wrapper"
import { Users, FileText, Receipt, DollarSign } from "lucide-react"
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

export default function PayrollPartnerDashboardPage() {
  const router = useRouter()
  const [periodFilter, setPeriodFilter] = useState("month")

  const { data: metrics, isLoading: metricsLoading } =
    api.payrollPartner.getDashboardMetrics.useQuery()

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payroll Partner Portal"
          description="Manage your workers and upload payroll documents"
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
      title: "Total Workers",
      value: metrics?.totalWorkers || 0,
      description: "Active workers",
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      title: "Pending Payslips",
      value: metrics?.pendingPayslips || 0,
      description: "To be uploaded",
      icon: FileText,
      iconColor: "text-yellow-600",
    },
    {
      title: "Invoices This Month",
      value: metrics?.invoicesThisMonth || 0,
      description: "Submitted to Aspirock",
      icon: Receipt,
      iconColor: "text-purple-600",
    },
    {
      title: "Revenue This Month",
      value: `$${(metrics?.revenueThisMonth || 0).toLocaleString()}`,
      description: "Total billed",
      icon: DollarSign,
      iconColor: "text-green-600",
    },
  ]

  // Mock data for charts
  const workerEvolutionData = metrics?.workerEvolution || [
    { month: "Jan", count: 15 },
    { month: "Feb", count: 18 },
    { month: "Mar", count: 22 },
    { month: "Apr", count: 20 },
    { month: "May", count: 28 },
    { month: "Jun", count: 32 },
  ]

  const countryDistributionData = metrics?.workersByCountry || [
    { name: "UK", value: 15, color: "#3b82f6" },
    { name: "France", value: 10, color: "#10b981" },
    { name: "Germany", value: 7, color: "#f59e0b" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Payroll Partner Portal"
          description="Manage your workers and upload payroll documents"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/payroll-partner/payslips/upload")}
          >
            Upload Payslip
          </Button>
          <Button onClick={() => router.push("/payroll-partner/invoices/upload")}>
            Upload Invoice
          </Button>
        </div>
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
        {/* Worker Evolution Chart */}
        <ChartWrapper
          title="Worker Evolution"
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
            <LineChart data={workerEvolutionData}>
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
                name="Workers"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Country Distribution Chart */}
        <ChartWrapper
          title="Workers by Country"
          description="Geographic distribution"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={countryDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {countryDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/payroll-partner/workers")}
        >
          <Users className="h-6 w-6 mb-2" />
          Manage Workers
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/payroll-partner/payslips/upload")}
        >
          <FileText className="h-6 w-6 mb-2" />
          Upload Payslip
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/payroll-partner/invoices/upload")}
        >
          <Receipt className="h-6 w-6 mb-2" />
          Upload Invoice
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => router.push("/payslips")}
        >
          <FileText className="h-6 w-6 mb-2" />
          View All Payslips
        </Button>
      </div>
    </div>
  )
}
