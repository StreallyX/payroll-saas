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
import { Search, MessageSquare, CheckCircle2, XCircle, Clock, RefreshCw, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export default function SMSLogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  const { data: logsData, isLoading } = api.smsLog.getAll.useQuery({
    recipient: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    page,
    pageSize: 20,
  })

  const { data: statsData } = api.smsLog.getStats.useQuery()

  const resendMutation = api.smsLog.resend.useMutation({
    onSuccess: () => toast.success("SMS queued for resending"),
    onError: (error) => toast.error(error.message)
  })

  if (isLoading) return <LoadingState message="Loading SMS logs..." />

  const logs = logsData?.data?.items || []
  const stats = statsData?.data
  const pagination = logsData?.data?.pagination

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Logs" description="View and monitor all SMS activity and costs">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SMS</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.sent}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.failed}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState title="No SMS logs found" description="No SMS messages match your search criteria" icon={MessageSquare} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.recipient}</TableCell>
                      <TableCell className="max-w-md truncate">{log.message}</TableCell>
                      <TableCell><Badge variant={log.status === 'SENT' ? 'default' : log.status === 'FAILED' ? 'destructive' : 'secondary'}>{log.status}</Badge></TableCell>
                      <TableCell className="text-sm">${(log.cost || 0).toFixed(3)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{log.sentAt ? format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm') : '-'}</TableCell>
                      <TableCell className="text-right">
                        {log.status === 'FAILED' && (
                          <Button size="sm" variant="ghost" onClick={() => resendMutation.mutate({ id: log.id })} disabled={resendMutation.isPending}><RefreshCw className="h-3 w-3" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={!pagination.hasPrevious} onClick={() => setPage(page - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
