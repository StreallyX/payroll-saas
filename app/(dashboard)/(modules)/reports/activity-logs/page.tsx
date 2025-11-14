
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Activity, User, FileText, Calendar } from "lucide-react"
import { api } from "@/lib/trpc"
import { LoadingPage } from "@/components/ui/loading-spinner"

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  const { data: logsData, isLoading } = api.auditLog.getAll.useQuery({
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    limit: 100
  })

  const { data: statsData } = api.auditLog.getStats.useQuery()

  if (isLoading) {
    return <LoadingPage />
  }

  const logs = logsData?.logs || []
  const stats = statsData || { totalLogs: 0, actionBreakdown: [], entityBreakdown: [], recentActivity: [] }

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      log?.description?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      log?.userName?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      log?.entityType?.toLowerCase()?.includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-700 border-green-200"
      case "UPDATE":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200"
      case "EXPORT":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "GENERATE":
        return "bg-orange-100 text-orange-700 border-orange-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all user actions and system events"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
            <User className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.actionBreakdown[0]?._count || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.actionBreakdown[0]?.action || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Entity</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.entityBreakdown[0]?._count || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.entityBreakdown[0]?.entityType || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.recentActivity || []).filter(
                (log: any) =>
                  new Date(log?.createdAt || "").toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Actions today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="LEAD">Leads</SelectItem>
                <SelectItem value="CONTRACT">Contracts</SelectItem>
                <SelectItem value="AGENCY">Agencies</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="CONTRACTOR">Contractors</SelectItem>
                <SelectItem value="INVOICE">Invoices</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
                <SelectItem value="GENERATE">Generate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activity logs found</p>
              </div>
            ) : (
              filteredLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <Badge className={getActionColor(log.action)} variant="outline">
                        {log.action}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100">
                        {log.entityType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userName} ({log.userRole})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.ipAddress && (
                        <>
                          <span>•</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
