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
import { Download, MapPin, FileText } from "lucide-react"
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

export default function ContractsByCountryReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  const { data: contractsReport, isLoading } = api.report.getContractsByCountry.useQuery({
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
      reportType: "contracts_by_country",
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
        <PageHeader title="Contracts by Country" description="Geographic distribution" />
        <div className="animate-pulse">
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  const countryData = contractsReport?.byCountry || []
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Contracts by Country"
          description="Geographic distribution of contracts"
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
          <CardDescription>Filter contracts by date range</CardDescription>
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

      {/* Total Contracts */}
      <StatsCard
        title="Total Contracts"
        value={contractsReport?.totalContracts || 0}
        description="Across all countries"
        icon={FileText}
        iconColor="text-blue-600"
      />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <ChartWrapper title="Contracts per Country" description="Distribution by country">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Contracts" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Pie Chart */}
        <ChartWrapper title="Distribution Percentage" description="Proportional breakdown">
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
                dataKey="count"
              >
                {countryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Contracts by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Number of Contracts</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Inactive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No contracts found for the selected period
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
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{row.percentage.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {row.active || 0}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.inactive || 0}
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
