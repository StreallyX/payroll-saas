"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/shared/stats-card"
import { ChartWrapper } from "@/components/shared/chart-wrapper"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { Download, TrendingUp, DollarSign, Percent } from "lucide-react"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { toast } from "sonner"

export default function MarginReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [groupBy, setGroupBy] = useState<"month" | "quarter" | "year">("month")

  const { data: marginReport, isLoading } = api.report.getMarginReport.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy,
  })

  const exportMutation = api.report.exportReport.useMutation({
    onSuccess: () => {
      toast.success("Report exported successfully!")
    },
    onError: () => {
      toast.error("Failed to export report")
    },
  })

  const handleExport = (format: "csv" | "pdf" | "excel") => {
    exportMutation.mutate({
      reportType: "margin",
      format,
      filters: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Margin Report" description="View gross margin and profitability" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `$${(marginReport?.totalRevenue || 0).toLocaleString()}`,
      description: "Invoiced to clients",
      icon: DollarSign,
      iconColor: "text-green-600",
    },
    {
      title: "Total Costs",
      value: `$${(marginReport?.totalCosts || 0).toLocaleString()}`,
      description: "Paid to workers/partners",
      icon: DollarSign,
      iconColor: "text-red-600",
    },
    {
      title: "Gross Margin",
      value: `$${(marginReport?.grossMargin || 0).toLocaleString()}`,
      description: `${(marginReport?.marginPercentage || 0).toFixed(1)}% margin`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      trend: {
        value: `${(marginReport?.marginPercentage || 0).toFixed(1)}%`,
        isPositive: (marginReport?.marginPercentage || 0) > 0,
      },
    },
  ]

  const chartData = marginReport?.breakdown || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Margin Report"
          description="View gross margin and profitability over time"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select date range and grouping</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            iconColor={stat.iconColor}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Chart */}
      <ChartWrapper
        title="Revenue vs Costs vs Margin"
        description="Financial performance over time"
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="costs"
              stroke="#ef4444"
              strokeWidth={2}
              name="Costs"
            />
            <Line
              type="monotone"
              dataKey="margin"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Margin"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Period-by-period analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No data available for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  chartData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.period}</TableCell>
                      <TableCell className="text-right">
                        ${row.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${row.costs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${row.margin.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={row.marginPercentage > 0 ? "text-green-600" : "text-red-600"}
                        >
                          {row.marginPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
