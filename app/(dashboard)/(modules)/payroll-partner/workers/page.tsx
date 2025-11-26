"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/status-badge"
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
import { Search, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export default function PayrollPartnerWorkersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [salaryTypeFilter, setSalaryTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const perPage = 20

  const { data: workersData, isLoading } = api.payrollPartner.listWorkers.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    countryCode: countryFilter === "all" ? undefined : countryFilter,
    salaryType: salaryTypeFilter === "all" ? undefined : salaryTypeFilter,
    search: searchQuery || undefined,
    page,
    limit: perPage,
  })

  const { data: countries } = api.country.list.useQuery()

  const workers = workersData?.workers || []
  const totalPages = Math.ceil((workersData?.total || 0) / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Workers"
          description="Manage and view your workers"
        />
        <Button onClick={() => router.push("/users/new?type=worker")}>
          Add Worker
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Country" />
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={salaryTypeFilter} onValueChange={setSalaryTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Salary Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : workers.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No workers found</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setCountryFilter("all")
                  setSalaryTypeFilter("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Salary Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">
                    {worker.firstName} {worker.lastName}
                  </TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{worker.countryCode}</TableCell>
                  <TableCell className="capitalize">
                    {worker.salaryType || "N/A"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={worker.status || "pending"} />
                  </TableCell>
                  <TableCell>
                    {worker.createdAt
                      ? format(new Date(worker.createdAt), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/payroll-partner/workers/${worker.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{" "}
            {Math.min(page * perPage, workersData?.total || 0)} of{" "}
            {workersData?.total || 0} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
