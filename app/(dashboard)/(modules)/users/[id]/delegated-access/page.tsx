"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UserPlus,
  AlertCircle,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function DelegatedAccessPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const utils = api.useUtils();
  const { data: user } = api.user.getById.useQuery({ id: userId });
  const { data: grants = [], isLoading } = api.delegatedAccess.list.useQuery({ userId });
  const { data: allUsers = [] } = api.user.getAll.useQuery();

  const grantMutation = api.delegatedAccess.grant.useMutation({
    onSuccess: () => {
      toast.success("Access granted successfully");
      utils.delegatedAccess.list.invalidate();
      setIsDialogOpen(false);
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to grant access");
    },
  });

  const revokeMutation = api.delegatedAccess.revoke.useMutation({
    onSuccess: () => {
      toast.success("Access revoked successfully");
      utils.delegatedAccess.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke access");
    },
  });

  const handleGrantAccess = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    grantMutation.mutate({
      grantedToUserId: userId,
      grantedForUserId: selectedUserId,
    });
  };

  const handleRevokeAccess = (grantId: string) => {
    if (confirm("Are you sure you want to revoke this access?")) {
      revokeMutation.mutate({ id: grantId });
    }
  };

  // Filter out users that already have delegated access
  const grantedUserIds = grants.map((g) => g.grantedForUserId);
  const availableUsers = allUsers.filter(
    (u) => u.id !== userId && !grantedUserIds.includes(u.id)
  );

  return (
    <RouteGuard permission="user.update.global">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/users/${userId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Profile
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>

        <PageHeader
          title="Manage Delegated Access"
          description={`Control which users ${user?.name || user?.email} can view and manage`}
        />

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Delegated access allows users with limited permissions (own scope) to view and manage specific other users.
            This is useful for team leads or managers who need to see their team members' data.
          </AlertDescription>
        </Alert>

        {/* Grants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Granted Access ({grants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : grants.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No delegated access granted yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Grant Access" to allow this user to view other users.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Can Access User</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Granted At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((grant) => (
                    <TableRow key={grant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {grant.grantedForUser.name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {grant.grantedForUser.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {grant.grantedByUser.name || grant.grantedByUser.email}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(grant.createdAt)}</TableCell>
                      <TableCell>
                        {grant.expiresAt ? (
                          <Badge
                            variant={
                              new Date(grant.expiresAt) < new Date()
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {formatDate(grant.expiresAt)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Never</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeAccess(grant.id)}
                          disabled={revokeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grant Access Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Delegated Access</DialogTitle>
              <DialogDescription>
                Select a user that {user?.name || user?.email} should have access to view and manage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No users available
                      </div>
                    ) : (
                      availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email} - {u.role?.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedUserId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGrantAccess}
                disabled={!selectedUserId || grantMutation.isPending}
              >
                {grantMutation.isPending ? "Granting..." : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
