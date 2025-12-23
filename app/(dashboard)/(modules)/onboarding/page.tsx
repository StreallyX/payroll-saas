"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, Eye, ThumbsUp, ThumbsDown, FileText, 
  CheckCircle2, Clock, XCircle, Circle, AlertCircle,
  Filter, Download
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { downloadFile } from "@/lib/s3";

// TRPC TYPES
type TRPCRouterOutputs = inferRouterOutputs<AppRouter>;
type UserOnboarding = TRPCRouterOutputs["onboarding"]["getAllUserOnboarding"][number];
type OnboardingResponse = UserOnboarding["onboardingResponses"][number];

export default function AllOnboardingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserOnboarding | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<OnboardingResponse | null>(null);

  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data: users = [], isLoading, refetch } =
    api.onboarding.getAllUserOnboarding.useQuery();

  const approveMutation = api.onboarding.approveResponse.useMutation({
    onSuccess: () => {
      toast.success("Response approved successfully");
      refetch();
      setApproveDialogOpen(false);
      setApproveComment("");
      setSelectedResponse(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = api.onboarding.rejectResponse.useMutation({
    onSuccess: () => {
      toast.success("Response rejected");
      refetch();
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedResponse(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleApprove = (response: OnboardingResponse) => {
    setSelectedResponse(response);
    setApproveDialogOpen(true);
  };

  const handleApproveSubmit = () => {
    if (!selectedResponse) return;

    approveMutation.mutate({
      responseId: selectedResponse.id,
      comment: approveComment.trim() || undefined,
    });
  };

  const handleReject = (response: OnboardingResponse) => {
    setSelectedResponse(response);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedResponse) return;
    if (!rejectReason.trim()) {
      return toast.error("Please provide a rejection reason");
    }

    rejectMutation.mutate({
      responseId: selectedResponse.id,
      adminNotes: rejectReason.trim(),
    });
  };

  const handleViewFile = async (filePath: string) => {
    try {
      toast.info("Loading file...");
      const url = await downloadFile(filePath);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Failed to open file: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            <Circle className="w-3 h-3 mr-1" />
            Not Submitted
          </Badge>
        );
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-600";
    if (progress >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  if (isLoading) return <LoadingState message="Loading onboardings..." />;

  // Calculate stats
  const stats = {
    total: users.length,
    completed: users.filter((u) => u.stats.progress === 100).length,
    inProgress: users.filter(
      (u) => u.stats.progress > 0 && u.stats.progress < 100
    ).length,
    notStarted: users.filter((u) => u.stats.progress === 0).length,
    pendingReview: users.filter((u) => u.stats.pendingResponses > 0).length,
  };

  // Filter users
  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.user?.name?.toLowerCase().includes(q) ||
      u.user?.email?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && u.stats.progress === 100) ||
      (statusFilter === "in_progress" && u.stats.progress > 0 && u.stats.progress < 100) ||
      (statusFilter === "pending_review" && u.stats.pendingResponses > 0) ||
      (statusFilter === "not_started" && u.stats.progress === 0);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Onboardings"
        description="Review and manage all user onboarding submissions"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.notStarted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_review">Pending Review</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Users Found"
          description="No users match your search criteria"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((u) => (
            <Card key={u.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {u.user?.name || "Unknown User"}
                      {u.stats.progress === 100 && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {u.user?.email}
                    </CardDescription>

                    <div className="mt-2 text-sm text-gray-600">
                      Template: <span className="font-medium">{u.onboardingTemplate?.name || "None"}</span>
                    </div>
                  </div>

                  <Badge className={`${getProgressColor(u.stats.progress)} text-white text-lg px-3 py-1`}>
                    {u.stats.progress}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {u.stats.completedResponses}/{u.stats.totalQuestions} approved
                    </span>
                  </div>
                  <Progress value={u.stats.progress} className="h-2" />
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                  {u.stats.completedResponses > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {u.stats.completedResponses} Approved
                    </Badge>
                  )}
                  {u.stats.pendingResponses > 0 && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {u.stats.pendingResponses} Pending
                    </Badge>
                  )}
                  {u.stats.totalQuestions - u.stats.completedResponses - u.stats.pendingResponses > 0 && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {u.stats.totalQuestions - u.stats.completedResponses - u.stats.pendingResponses} Remaining
                    </Badge>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedUser(u);
                    setViewDetailsOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" /> 
                  View Details & Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedUser?.user?.name}'s Onboarding
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.user?.email} • Template: {selectedUser?.onboardingTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Overall Progress</span>
              <Badge className={`${getProgressColor(selectedUser?.stats.progress || 0)} text-white`}>
                {selectedUser?.stats.progress}%
              </Badge>
            </div>
            <Progress value={selectedUser?.stats.progress || 0} className="h-3" />
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-green-600">✓ {selectedUser?.stats.completedResponses} Approved</span>
              <span className="text-yellow-600">⏳ {selectedUser?.stats.pendingResponses} Pending</span>
              <span className="text-gray-600">
                📝 {(selectedUser?.stats.totalQuestions || 0) - (selectedUser?.stats.completedResponses || 0) - (selectedUser?.stats.pendingResponses || 0)} Remaining
              </span>
            </div>
          </div>

          {/* Responses */}
          <div className="space-y-4 mt-4">
            {selectedUser?.onboardingResponses?.map((r: OnboardingResponse, index: number) => {
              const isRejected = r.status === "rejected";
              const isPending = r.status === "pending";
              const isApproved = r.status === "approved";
              const hasResponse = r.responseText || r.responseFilePath;

              return (
                <Card 
                  key={r.id}
                  className={`${
                    isRejected ? "border-red-300 bg-red-50" : 
                    isPending ? "border-yellow-300 bg-yellow-50" : 
                    isApproved ? "border-green-300 bg-green-50" : 
                    "border-gray-200"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {index + 1}. {r.question?.questionText}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {r.question?.questionType === "text" ? "Text Answer" : "File Upload"}
                          {r.question?.isRequired && " • Required"}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(r.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Response Content */}
                    {hasResponse ? (
                      <div className="bg-white p-4 rounded-lg border">
                        {r.responseText && (
                          <div>
                            <Label className="text-xs text-gray-600">User's Answer:</Label>
                            <p className="mt-2 text-gray-900">{r.responseText}</p>
                          </div>
                        )}

                        {r.responseFilePath && (
                          <div>
                            <Label className="text-xs text-gray-600">Uploaded Document:</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleViewFile(r.responseFilePath!)}
                            >
                              <FileText className="w-4 h-4 mr-2" /> View File
                            </Button>
                          </div>
                        )}

                        {/* Submission Date */}
                        {r.submittedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(r.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          User has not submitted a response yet
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Admin Notes (if rejected) */}
                    {isRejected && r.adminNotes && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {r.adminNotes}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Review Info */}
                    {(isApproved || isRejected) && r.reviewedAt && (
                      <p className="text-xs text-gray-500">
                        Reviewed: {new Date(r.reviewedAt).toLocaleString()}
                      </p>
                    )}

                    {/* Action Buttons (only for pending) */}
                    {isPending && hasResponse && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(r)}
                          disabled={approveMutation.isPending}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                        </Button>

                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject(r)}
                          disabled={rejectMutation.isPending}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Response</DialogTitle>
            <DialogDescription>
              You are approving this response. You can optionally add a comment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Comment (Optional)</Label>
              <Textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
                placeholder="Add a comment for the user..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveSubmit}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Response</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for rejection. The user will see this message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g., Document is unclear, information is incomplete, wrong document uploaded..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={handleRejectSubmit}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
