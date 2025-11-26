"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/shared/stats-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChartWrapper } from "@/components/shared/chart-wrapper"
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
import { Download, Users, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { toast } from "sonner"

export default function LiveContractorsReportPage() {
  const [countryFilter, setCountryFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  const { data: contractorsReport, isLoading } = api.report.getLiveContractors.useQuery({
    countryCode: countryFilter === "all" ? undefined : countryFilter,
    clientId: clientFilter === "all" ? undefined : clientFilter,
  })

  const { data: countries } = api.country.list.useQuery()
  const { data: clients } = api.company.list.useQuery({ type: "client" })

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
      reportType: "live_contractors",
      format,
      filters: {
        countryCode: countryFilter === "all" ? undefined : countryFilter,
        clientId: clientFilter === "all" ? undefined : clientFilter,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Live Contractors" description="Active contractors overview" />
        <div className="animate-pulse">
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  const statusDistribution = contractorsReport?.byStatus || []
  const countryDistribution = contractorsReport?.byCountry || []

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Live Contractors"
          description="Active contractors and their distribution"
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries?.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.companies.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Total Count */}
      <StatsCard
        title="Total Active Contractors"
        value={contractorsReport?.totalActive || 0}
        description="Currently active in the system"
        icon={Users}
        iconColor="text-green-600"
      />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <ChartWrapper title="Status Distribution" description="Breakdown by status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Country Distribution */}
        <ChartWrapper title="Distribution by Country" description="Geographic breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Contractors List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Contractors</CardTitle>
          <CardDescription>Complete list of active contractors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!contractorsReport?.contractors || contractorsReport.contractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No active contractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  contractorsReport.contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium">
                        {contractor.firstName} {contractor.lastName}
                      </TableCell>
                      <TableCell>{contractor.email}</TableCell>
                      <TableCell>{contractor.countryCode}</TableCell>
                      <TableCell>{contractor.clientName || "N/A"}</TableCell>
                      <TableCell>
                        {contractor.startDate
                          ? format(new Date(contractor.startDate), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={contractor.status || "active"} />
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
