"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatsCard } from "@/components/shared/stats-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, ListTodo, RefreshCw, ThumbsUp, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";
import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500",
  PENDING: "bg-yellow-500",
  WAITING_FOR_CONFIRMATION: "bg-orange-500",
  DEV_COMPLETED: "bg-purple-500",
  NEEDS_REVISION: "bg-amber-500",
  VALIDATED: "bg-green-500",
  REJECTED: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  WAITING_FOR_CONFIRMATION: "Awaiting Confirmation",
  DEV_COMPLETED: "Awaiting Validation",
  NEEDS_REVISION: "Needs Revision",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-red-500",
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  ADD: "bg-green-600",
  DELETE: "bg-red-600",
  MODIFY: "bg-blue-600",
};

export default function ManageFeatureRequestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [actionTypeFilter, setActionTypeFilter] = useState<string | undefined>(undefined);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Permission checks
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();
  const VIEW_ALL = buildPermissionKey(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL);
  const MANAGE_PLATFORM = buildPermissionKey(Resource.PLATFORM, Action.UPDATE, PermissionScope.GLOBAL);
  const UPDATE_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.UPDATE, PermissionScope.GLOBAL);

  const canViewAll = isSuperAdmin || hasPermission(VIEW_ALL);
  const canManage = isSuperAdmin || hasAnyPermission([MANAGE_PLATFORM, UPDATE_REQUEST]);

  // Fetch requests
  const { data: requests, isLoading, refetch } = api.featureRequest.getAll.useQuery(
    {
      status: statusFilter,
      priority: priorityFilter,
      actionType: actionTypeFilter,
      search: search || undefined,
    },
    { enabled: canViewAll }
  );

  // Update status mutation
  const updateStatusMutation = api.featureRequest.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Request status updated successfully!");
      refetch();
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequestId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update request status");
    },
  });

  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => ["SUBMITTED", "PENDING", "WAITING_FOR_CONFIRMATION"].includes(r.status)).length || 0,
    devCompleted: requests?.filter((r) => r.status === "DEV_COMPLETED").length || 0,
    needsRevision: requests?.filter((r) => r.status === "NEEDS_REVISION").length || 0,
    validated: requests?.filter((r) => r.status === "VALIDATED").length || 0,
    rejected: requests?.filter((r) => r.status === "REJECTED").length || 0,
  };

  // Handlers
  const handleMarkCompleted = (id: string) => {
    updateStatusMutation.mutate({
      id,
      status: "DEV_COMPLETED",
    });
  };

  const handleReject = (id: string) => {
    setSelectedRequestId(id);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedRequestId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    updateStatusMutation.mutate({
      id: selectedRequestId,
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
    });
  };

  const handleViewDetails = (id: string) => {
    router.push(`/feature-requests/${id}`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setActionTypeFilter(undefined);
  };

  // Access check
  if (!canViewAll) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={AlertCircle}
              title="Access Denied"
              description="You don't have permission to manage feature requests."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Manage Feature Requests"
        description="Review and manage all feature requests from users"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
        <StatsCard
          title="Total Requests"
          value={stats.total}
          icon={ListTodo}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          iconColor="text-yellow-500"
        />
        <StatsCard
          title="Awaiting Validation"
          value={stats.devCompleted}
          icon={ThumbsUp}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Needs Revision"
          value={stats.needsRevision}
          icon={RefreshCw}
          iconColor="text-amber-500"
        />
        <StatsCard
          title="Validated"
          value={stats.validated}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          iconColor="text-red-500"
        />
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="WAITING_FOR_CONFIRMATION">Awaiting Confirmation</SelectItem>
                <SelectItem value="DEV_COMPLETED">Awaiting Validation</SelectItem>
                <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                <SelectItem value="VALIDATED">Validated</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Type Filter */}
            <Select value={actionTypeFilter || "all"} onValueChange={(v) => setActionTypeFilter(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Action Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ADD">Add</SelectItem>
                <SelectItem value="MODIFY">Modify</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(search || statusFilter || priorityFilter || actionTypeFilter) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {requests?.length || 0} request(s) found
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="mt-6">
        {isLoading ? (
          <LoadingState message="Loading feature requests..." />
        ) : !requests || requests.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No Feature Requests"
            description="No feature requests match your filters."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.description.substring(0, 150)}
                            {request.description.length > 150 && "..."}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_COLORS[request.status]}>
                          {STATUS_LABELS[request.status]}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[request.priority]}>
                          {request.priority}
                        </Badge>
                        <Badge className={ACTION_TYPE_COLORS[request.actionType]}>
                          {request.actionType}
                        </Badge>
                        <Badge variant="outline">{request.pageName}</Badge>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <strong>Requester:</strong> {request.user?.name || request.user?.email || "Unknown User"}
                        </span>
                        <span>
                          <strong>Role:</strong> {request.userRole}
                        </span>
                        <span>
                          <strong>Date:</strong> {format(new Date(request.createdAt), "PPP")}
                        </span>
                        {request.attachments && request.attachments.length > 0 && (
                          <span>
                            <strong>Attachments:</strong> {request.attachments.length}
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {request.status === "REJECTED" && request.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
                        </div>
                      )}

                      {/* Revision Feedback */}
                      {request.status === "NEEDS_REVISION" && request.revisionFeedback && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm font-medium text-amber-900">Revision Feedback:</p>
                          <p className="text-sm text-amber-700 mt-1">{request.revisionFeedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {/* Show Mark as Completed for pending/needs revision requests */}
                        {["SUBMITTED", "PENDING", "WAITING_FOR_CONFIRMATION", "NEEDS_REVISION"].includes(request.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => handleMarkCompleted(request.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Wrench className="h-4 w-4 mr-1" />
                              Mark Completed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(request.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Show status info for completed/validated */}
                        {request.status === "DEV_COMPLETED" && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            Awaiting Requester Validation
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Feature Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will be visible to the requester.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updateStatusMutation.isPending || !rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
