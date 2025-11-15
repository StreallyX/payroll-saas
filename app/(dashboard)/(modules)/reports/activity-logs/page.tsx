"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Activity, User, FileText, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { AuditLogDetailsDialog } from "@/components/audit/audit-log-details-dialog";

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: logsData, isLoading } = api.auditLog.getAll.useQuery({
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    limit: 100,
  });

  const { data: statsData } = api.auditLog.getStats.useQuery();

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  const logs = logsData?.logs || [];
  const stats = statsData || {
    totalLogs: 0,
    actionBreakdown: [],
    entityBreakdown: [],
    recentActivity: [],
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      log?.description?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      log?.userName?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      log?.entityType?.toLowerCase()?.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Activity Logs"
          description="Track all user actions and system events with complete audit trail"
        />
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
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
                  new Date(log?.createdAt || "").toDateString() ===
                  new Date().toDateString()
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
                placeholder="Search logs by description, user, or entity..."
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
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ROLE">Roles</SelectItem>
                <SelectItem value="CONTRACTOR">Contractors</SelectItem>
                <SelectItem value="AGENCY">Agencies</SelectItem>
                <SelectItem value="CONTRACT">Contracts</SelectItem>
                <SelectItem value="INVOICE">Invoices</SelectItem>
                <SelectItem value="LEAD">Leads</SelectItem>
                <SelectItem value="COMPANY">Companies</SelectItem>
                <SelectItem value="BANK">Banks</SelectItem>
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
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
                <SelectItem value="GENERATE">Generate</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Timeline</CardTitle>
            <Badge variant="outline">{filteredLogs.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={filteredLogs} onViewDetails={handleViewDetails} />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <AuditLogDetailsDialog
        log={selectedLog}
        open={detailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
