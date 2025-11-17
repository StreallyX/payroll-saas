"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { RouteGuard } from "@/components/guards/RouteGuard"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Clock, CheckCircle, XCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

/**
 * Adaptive Timesheets Page
 * 
 * Permissions:
 * - timesheets.view_own: User sees only their own timesheets
 * - timesheets.manage.view_all: Admin sees all timesheets
 * 
 * Adaptive behavior:
 * - Contractors see only their timesheets
 * - Admins see all timesheets with management actions
 */
function TimesheetsPageContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data: timesheets, isLoading } = api.timesheet.getAll.useQuery()

  const approveMutation = api.timesheet.approve.useMutation({
    onSuccess: () => {
      toast.success("Timesheet approved successfully!")
      // Tu pourras invalider la query ici si tu veux
      // utils.timesheet.getAll.invalidate()
    },
  })

  if (isLoading) return <LoadingState message="Loading timesheets..." />

  const timesheetsList = timesheets ?? []

  // 🔢 Stats calculées côté front
  const totalHours = timesheetsList.reduce(
    (sum: number, t: any) => sum + (t.totalHours ?? 0),
    0
  )

  const pendingApproval = timesheetsList.filter(
    (t: any) => t.status === "submitted"
  ).length

  const approvedCount = timesheetsList.filter(
    (t: any) => t.status === "approved"
  ).length

  const rejectedCount = timesheetsList.filter(
    (t: any) => t.status === "rejected"
  ).length

  // 🔍 Filtrage
  const filteredTimesheets = timesheetsList.filter((t: any) => {
    const matchesSearch = t.contractor?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || t.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Timesheets" description="Manage and approve contractor timesheets">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Timesheet
          </Button>
        </div>
      </PageHeader>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTimesheets.length === 0 ? (
            <>
              <EmptyState
                title="No timesheets found"
                description="Create your first timesheet"
                icon={Clock}
                onAction={() => {}}
              />
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> New Timesheet
              </Button>
            </>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredTimesheets.map((timesheet: any) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{timesheet.contractor?.user?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{timesheet.contractor?.user?.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(timesheet.startDate), "MMM dd")}
                        </p>
                        <p className="text-xs text-gray-500">
                          to {format(new Date(timesheet.endDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{timesheet.totalHours ?? 0}h</Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          timesheet.status === "approved"
                            ? "default"
                            : timesheet.status === "rejected"
                            ? "destructive"
                            : timesheet.status === "submitted"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {timesheet.status.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {timesheet.submittedAt
                        ? format(new Date(timesheet.submittedAt), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      {timesheet.status === "submitted" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => approveMutation.mutate({ id: timesheet.id })}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Timesheets page with route guard
 * Users need either view_own OR manage.view_all permission
 */
export default function TimesheetsPage() {
  return (
    <RouteGuard
      permissions={["timesheets.view_own", "timesheets.manage.view_all"]}
      requireAll={false}
    >
      <TimesheetsPageContent />
    </RouteGuard>
  )
}
