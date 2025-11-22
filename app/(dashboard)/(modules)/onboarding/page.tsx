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
import { Search, Eye, ThumbsUp, ThumbsDown, FileText } from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { downloadFile } from "@/lib/s3";

// ------------------ TRPC TYPES ------------------
type TRPCRouterOutputs = inferRouterOutputs<AppRouter>;
type UserOnboarding = TRPCRouterOutputs["onboarding"]["getAllUserOnboarding"][number];
type OnboardingResponse = UserOnboarding["onboardingResponses"][number];
// -------------------------------------------------

export default function ManageOnboardingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOnboarding | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<OnboardingResponse | null>(null);

  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: users = [], isLoading, refetch } =
    api.onboarding.getAllUserOnboarding.useQuery();

  const approveMutation = api.onboarding.approveResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse approuvée");
      refetch();
    },
  });

  const rejectMutation = api.onboarding.rejectResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse rejetée");
      refetch();
      setRejectDialogOpen(false);
      setAdminNotes("");
      setSelectedResponse(null);
    },
  });

  const handleApprove = (responseId: string) => {
    approveMutation.mutate({ responseId });
  };

  const handleRejectSubmit = () => {
    if (!selectedResponse) return;
    if (!adminNotes.trim()) return toast.error("Veuillez fournir une raison");

    rejectMutation.mutate({
      responseId: selectedResponse.id,
      adminNotes: adminNotes.trim(),
    });
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await downloadFile(filePath);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Impossible d’ouvrir le fichier : " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded text-xs font-medium";
    switch (status) {
      case "approved":
        return <span className={`${base} bg-green-100 text-green-700`}>Approved</span>;
      case "pending":
        return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
      case "rejected":
        return <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>;
      default:
        return <span className={base}>{status}</span>;
    }
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.user?.name?.toLowerCase().includes(q) ||
      u.user?.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <LoadingState message="Chargement..." />;

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.stats.pendingResponses > 0).length,
    completed: users.filter((u) => u.stats.progress === 100).length,
    inProgress: users.filter(
      (u) => u.stats.progress > 0 && u.stats.progress < 100
    ).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        description="Validation des onboardings utilisateurs"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent><div className="text-3xl">{stats.total}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent><div className="text-3xl">{stats.pending}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>En cours</CardTitle></CardHeader><CardContent><div className="text-3xl">{stats.inProgress}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Complétés</CardTitle></CardHeader><CardContent><div className="text-3xl">{stats.completed}</div></CardContent></Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun onboarding"
          description="Aucun utilisateur n’a soumis d’informations."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition">
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{u.user?.name}</CardTitle>
                    <CardDescription>{u.user?.email}</CardDescription>

                    <p className="text-sm text-gray-600 mt-1">
                      Template: {u.onboardingTemplate?.name || "Aucun"}
                    </p>
                  </div>

                  <Badge>{u.stats.progress}%</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression</span>
                    <span>
                      {u.stats.completedResponses}/{u.stats.totalQuestions}
                    </span>
                  </div>
                  <Progress value={u.stats.progress} />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedUser(u);
                    setViewDetailsOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" /> Voir détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails</DialogTitle>
            <DialogDescription>
              {selectedUser?.user?.name} – {selectedUser?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedUser?.onboardingResponses?.map((r: OnboardingResponse) => (
              <Card key={r.id}>
                <CardHeader className="flex justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {r.question?.questionText}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Type: {r.question?.questionType}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </CardHeader>

                <CardContent className="space-y-3">
                  {r.responseText && (
                    <div>
                      <Label className="text-xs">Réponse :</Label>
                      <p className="mt-1">{r.responseText}</p>
                    </div>
                  )}

                  {r.responseFilePath && (
                    <div>
                      <Label className="text-xs">Document :</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(r.responseFilePath!)}
                      >
                        <FileText className="w-4 h-4 mr-2" /> Voir le fichier
                      </Button>
                    </div>
                  )}

                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(r.id)}
                        disabled={approveMutation.isPending}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Approuver
                      </Button>

                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          setSelectedResponse(r);
                          setRejectDialogOpen(true);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" /> Rejeter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la réponse</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label>Raison *</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Document illisible, informations manquantes..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>

            <Button
              variant="destructive"
              disabled={!adminNotes.trim()}
              onClick={handleRejectSubmit}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
