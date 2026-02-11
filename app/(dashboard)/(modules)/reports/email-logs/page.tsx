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
import { Search, Mail, CheckCircle2, XCircle, Clock, RefreshCw, Eye } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"

export default function EmailLogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)

  const { data: logsData, isLoading } = api.emailLog.getAll.useQuery({
    recipient: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    page,
    pageSize: 20,
  })

  const { data: statsData } = api.emailLog.getStats.useQuery()

  const resendMutation = api.emailLog.resend.useMutation({
    onSuccess: () => toast.success("Email queued for resending"),
    onError: (error) => toast.error(error.message)
  })

  if (isLoading) return <LoadingState message="Loading email logs..." />

  const logs = logsData?.data?.items || []
  const stats = statsData?.data
  const pagination = logsData?.data?.pagination

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Email Logs" description="View and monitor all email activity">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
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
            <EmptyState title="No email logs found" description="No emails match your search criteria" icon={Mail} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.to || log.recipient}</TableCell>
                      <TableCell className="max-w-md truncate">{log.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge variant={log.status === 'SENT' ? 'default' : log.status === 'FAILED' ? 'destructive' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{log.sentAt ? format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedEmail(log)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {log.status === 'FAILED' && (
                            <Button size="sm" variant="ghost" onClick={() => resendMutation.mutate({ id: log.id })} disabled={resendMutation.isPending}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
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

      {/* Email Details Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Details
            </DialogTitle>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                  <p className="text-sm">{selectedEmail.to || selectedEmail.recipient}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedEmail.status)}
                    <Badge variant={selectedEmail.status === 'SENT' ? 'default' : selectedEmail.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {selectedEmail.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent At</p>
                  <p className="text-sm">{selectedEmail.sentAt ? format(new Date(selectedEmail.sentAt), 'MMM dd, yyyy HH:mm:ss') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{selectedEmail.createdAt ? format(new Date(selectedEmail.createdAt), 'MMM dd, yyyy HH:mm:ss') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">From</p>
                  <p className="text-sm">{selectedEmail.from || '-'}</p>
                </div>
                {selectedEmail.template && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Template</p>
                    <p className="text-sm">{selectedEmail.template}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                <p className="text-sm bg-muted p-2 rounded">{selectedEmail.subject}</p>
              </div>

              {selectedEmail.error && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Error</p>
                  <p className="text-sm bg-red-50 text-red-700 p-2 rounded whitespace-pre-wrap">{selectedEmail.error}</p>
                </div>
              )}

              {selectedEmail.status === 'FAILED' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      resendMutation.mutate({ id: selectedEmail.id })
                      setSelectedEmail(null)
                    }}
                    disabled={resendMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
