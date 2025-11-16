"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Clock, CheckCircle, XCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export default function TimesheetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data: timesheets, isLoading } = api.timesheet.getAll.useQuery()
  const { data: stats } = api.timesheet.getStats.useQuery()

  const approveMutation = api.timesheet.approve.useMutation({
    onSuccess: () => {
      toast.success("Timesheet approved successfully!")
      // Invalidate queries here
    },
  })

  if (isLoading) return <LoadingState message="Loading timesheets..." />

  const timesheetsList = timesheets || []
  const filteredTimesheets = timesheetsList.filter((t: any) => {
    const matchesSearch = t.contractor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Timesheets" description="Manage and approve contractor timesheets">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search contractor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Timesheet
          </Button>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalHours || 0}h</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.pendingApproval || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.approved || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.rejected || 0}</div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filteredTimesheets.length === 0 ? (
            <EmptyState title="No timesheets found" description="Create your first timesheet" icon={Clock} action={<Button><Plus className="h-4 w-4 mr-2" /> New Timesheet</Button>} />
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
                        <p className="font-medium">{timesheet.contractor?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{timesheet.contractor?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(timesheet.periodStart), 'MMM dd')}</p>
                        <p className="text-xs text-gray-500">to {format(new Date(timesheet.periodEnd), 'MMM dd, yyyy')}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{timesheet.totalHours || 0}h</Badge></TableCell>
                    <TableCell>
                      <Badge variant={
                        timesheet.status === 'APPROVED' ? 'default' :
                        timesheet.status === 'REJECTED' ? 'destructive' :
                        timesheet.status === 'SUBMITTED' ? 'secondary' : 'outline'
                      }>
                        {timesheet.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{timesheet.submittedAt ? format(new Date(timesheet.submittedAt), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right">
                      {timesheet.status === 'SUBMITTED' && (
                        <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate({ id: timesheet.id })}>
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
