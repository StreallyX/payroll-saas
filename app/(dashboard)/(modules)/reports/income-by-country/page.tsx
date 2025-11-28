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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { Download, DollarSign, MapPin } from "lucide-react"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { toast } from "sonner"

export default function IncomeByCountryReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  const { data: incomeReport, isLoading } = api.report.getIncomeByCountry.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const exportMutation = api.report.exportReport.useMutation({
    onSuccess: () => {
      toast.success("Report exported successfully!")
    },
    onError: () => {
      toast.error("Failed to export report")
    },
  })

  const handleExport = (format: "csv" | "pdf") => {
    exportMutation.mutate({
      reportType: "income_by_country",
      format,
      filters: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Income by Country" description="Revenue breakdown" />
        <div className="animate-pulse">
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  const countryData = incomeReport?.byCountry || []
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Income by Country"
          description="Revenue breakdown by geographic location"
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
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Filter income by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Total Income */}
      <StatsCard
        title="Total Income"
        value={`$${(incomeReport?.totalIncome || 0).toLocaleString()}`}
        description="Across all countries"
        icon={DollarSign}
        iconColor="text-green-600"
      />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <ChartWrapper title="Income per Country" description="Revenue by country">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Pie Chart */}
        <ChartWrapper title="Income Distribution" description="Proportional breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={countryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.country}: ${entry.percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="income"
              >
                {countryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Income by country with metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Contractors</TableHead>
                  <TableHead className="text-right">Avg per Contractor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No income data found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  countryData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {row.country}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${row.income.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{row.percentage.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-right">{row.contractors || 0}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        $
                        {row.contractors
                          ? (row.income / row.contractors).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "0"}
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
