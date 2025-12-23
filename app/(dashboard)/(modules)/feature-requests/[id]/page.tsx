"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, CheckCircle, XCircle, FileIcon, Calendar, User, MapPin, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";
import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500",
  PENDING: "bg-yellow-500",
  WAITING_FOR_CONFIRMATION: "bg-orange-500",
  CONFIRMED: "bg-green-500",
  REJECTED: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  WAITING_FOR_CONFIRMATION: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FeatureRequestDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Permission checks
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();
  const VIEW_ALL = buildPermissionKey(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL);
  const READ_OWN = buildPermissionKey(Resource.FEATURE_REQUEST, Action.READ, PermissionScope.OWN);
  const MANAGE_PLATFORM = buildPermissionKey(Resource.PLATFORM, Action.UPDATE, PermissionScope.GLOBAL);
  const UPDATE_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.UPDATE, PermissionScope.GLOBAL);

  const canView = isSuperAdmin || hasAnyPermission([VIEW_ALL, READ_OWN]);
  const canManage = isSuperAdmin || hasAnyPermission([MANAGE_PLATFORM, UPDATE_REQUEST]);

  // Fetch request details
  const { data: request, isLoading, refetch } = api.featureRequest.getById.useQuery(
    { id },
    { enabled: canView }
  );

  // Update status mutation
  const updateStatusMutation = api.featureRequest.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Request status updated successfully!");
      refetch();
      setRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update request status");
    },
  });

  // Handlers
  const handleConfirm = () => {
    if (!request) return;
    updateStatusMutation.mutate({
      id: request.id,
      status: "CONFIRMED",
    });
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!request) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    updateStatusMutation.mutate({
      id: request.id,
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
    });
  };

  const handleDownloadAttachment = (fileUrl: string, fileName: string) => {
    // In production, this would use the file viewing API
    window.open(`/api/files/view?key=${encodeURIComponent(fileUrl)}`, "_blank");
  };

  // Access check
  if (!canView) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={AlertCircle}
              title="Access Denied"
              description="You don't have permission to view this feature request."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading feature request details..." />;
  }

  if (!request) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={AlertCircle}
              title="Request Not Found"
              description="The feature request you're looking for doesn't exist."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title="Feature Request Details"
            description={`Request #${request.id.substring(0, 8)}`}
          />
        </div>
      </div>

      {/* Status and Actions Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${STATUS_COLORS[request.status]} text-white`}>
                {STATUS_LABELS[request.status]}
              </Badge>
              <Badge className={`${PRIORITY_COLORS[request.priority]} text-white`}>
                {request.priority} Priority
              </Badge>
              <Badge className={`${ACTION_TYPE_COLORS[request.actionType]} text-white`}>
                {request.actionType}
              </Badge>
            </div>

            {canManage && request.status !== "CONFIRMED" && request.status !== "REJECTED" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleConfirm}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Request
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>{request.title}</CardTitle>
              <CardDescription>Request Type: {request.actionType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {request.conditions && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Additional Conditions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.conditions}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Location</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{request.pageName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{request.pageUrl}</p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  {request.attachments.length} file(s) attached
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(2)} KB • {attachment.fileType}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadAttachment(attachment.fileUrl, attachment.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {request.status === "REJECTED" && request.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {request.rejectionReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle>Requester Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{request.user.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{request.user.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {request.userRole}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(request.createdAt), "PPpp")}
                  </p>
                </div>
              </div>

              {request.status === "CONFIRMED" && request.confirmedAt && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Confirmed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.confirmedAt), "PPpp")}
                      </p>
                      {request.confirmedByUser && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {request.confirmedByUser.name || request.confirmedByUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {request.status === "REJECTED" && request.rejectedAt && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.rejectedAt), "PPpp")}
                      </p>
                      {request.rejectedByUser && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {request.rejectedByUser.name || request.rejectedByUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {request.updatedAt !== request.createdAt && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.updatedAt), "PPpp")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
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
