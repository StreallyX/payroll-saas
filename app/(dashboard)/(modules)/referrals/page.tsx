"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";

import {
  UserPlus,
  Copy,
  Mail,
  Gift,
  Share2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";
import {
  StatsCardSkeleton,
  TableSkeleton,
} from "@/components/contractor/loading-skeleton";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { RouteGuard } from "@/components/guards/RouteGuard";

export default function ContractorReferPage() {
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    referredName: "",
    referredEmail: "",
    personalMessage: "",
  });

  // GET referral code
  const { data: referralCode, isLoading: codeLoading } =
    api.referral.getMyReferralCode.useQuery();

  // GET referrals list
  const {
    data: referrals,
    isLoading: referralsLoading,
    error: referralsError,
  } = api.referral.getMyReferrals.useQuery();

  // GET referral stats
  const { data: stats } = api.referral.getMyReferralStats.useQuery();

  // Send invitation
  const sendInvitation = api.referral.sendReferralInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully!",
      });
      setInviteForm({
        referredName: "",
        referredEmail: "",
        personalMessage: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  // Copy referral code
  const handleCopyCode = () => {
    if (referralCode?.referralCode) {
      navigator.clipboard.writeText(referralCode.referralCode);
      setCopied(true);

      toast({
        title: "Copied!",
        description: "Referral code copied",
      });

      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy referral link
  const handleCopyLink = () => {
    if (referralCode?.referralLink) {
      navigator.clipboard.writeText(referralCode.referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied",
      });
    }
  };

  // Send email invitation
  const handleSendInvitation = () => {
    if (!inviteForm.referredEmail || !inviteForm.referredName) {
      toast({
        title: "Validation Error",
        description: "Name and email required",
        variant: "destructive",
      });
      return;
    }

    sendInvitation.mutate({
      referredEmail: inviteForm.referredEmail,
      referredName: inviteForm.referredName,
      personalMessage: inviteForm.personalMessage || undefined,
    });
  };

  // === COLUMNS ADAPTED TO YOUR NEW BACKEND ===
  const columns: Column<any>[] = [
    {
      key: "referredName",
      label: "Name",
      render: (r) => (
        <span className="font-medium">
          {r.referredName || r.referredEmail}
        </span>
      ),
    },
    {
      key: "referredEmail",
      label: "Email",
      render: (r) => r.referredEmail,
    },
    {
      key: "referredAt",
      label: "Referral Date",
      sortable: true,
      render: (r) => new Date(r.referredAt).toLocaleDateString(),
    },
    {
      key: "acceptedAt",
      label: "Accepted",
      sortable: true,
      render: (r) =>
        r.acceptedAt ? new Date(r.acceptedAt).toLocaleDateString() : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "rewardAmount",
      label: "Reward",
      sortable: true,
      render: (r) =>
        r.rewardAmount ? (
          <span className="font-semibold text-green-600">
            ${Number(r.rewardAmount).toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">Pending</span>
        ),
    },
  ];

  return (
    <RouteGuard permissions={["referral.read.own"]}>
      <div className="space-y-6">
        <PageHeader
          title="Refer a Friend"
          description="Earn rewards by referring qualified contractors"
        />

        {/* === STATS === */}
        <div className="grid gap-4 md:grid-cols-4">
          {!stats ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Rewards"
                value={`$${stats.totalRewards?.toFixed(2) || "0.00"}`}
                icon={Gift}
              />

              <StatsCard
                title="Pending Rewards"
                value={`$${stats.pendingRewards?.toFixed(2) || "0.00"}`}
                icon={Gift}
              />

              <StatsCard
                title="Total Referrals"
                value={stats.totalReferrals || 0}
                icon={UserPlus}
              />

              <StatsCard
                title="Accepted Referrals"
                value={stats.byStatus.accepted || 0}
                icon={CheckCircle}
              />
            </>
          )}
        </div>

        <Tabs defaultValue="invite" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="rewards">Rewards Program</TabsTrigger>
          </TabsList>

          {/* === INVITE FORM === */}
          <TabsContent value="invite">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share Referral Code
                  </CardTitle>
                  <CardDescription>
                    Share your unique referral code
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {codeLoading ? (
                    <StatsCardSkeleton />
                  ) : referralCode ? (
                    <>
                      <Label>Your Code</Label>
                      <div className="flex gap-2">
                        <Input
                          value={referralCode.referralCode}
                          readOnly
                          className="font-mono text-lg"
                        />
                        <Button onClick={handleCopyCode}>
                          {copied ? <CheckCircle /> : <Copy />}
                        </Button>
                      </div>

                      <Label>Your Link</Label>
                      <div className="flex gap-2">
                        <Input
                          value={referralCode.referralLink}
                          readOnly
                        />
                        <Button onClick={handleCopyLink}>
                          <Copy />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle />
                      <AlertDescription>
                        Could not load referral code.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Invite via Email
                  </CardTitle>
                  <CardDescription>
                    Send a personalised invitation
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Label>Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={inviteForm.referredName}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        referredName: e.target.value,
                      })
                    }
                  />

                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={inviteForm.referredEmail}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        referredEmail: e.target.value,
                      })
                    }
                  />

                  <Label>Message (optional)</Label>
                  <Input
                    placeholder="I think you'd be a great fit..."
                    value={inviteForm.personalMessage}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        personalMessage: e.target.value,
                      })
                    }
                  />

                  <Button
                    className="w-full"
                    onClick={handleSendInvitation}
                    disabled={sendInvitation.isPending}
                  >
                    {sendInvitation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === REFERRALS TABLE === */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>
                  Track rewards and referral progress
                </CardDescription>
              </CardHeader>

              <CardContent>
                {referralsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle />
                    <AlertDescription>
                      {referralsError.message}
                    </AlertDescription>
                  </Alert>
                )}

                {referralsLoading ? (
                  <TableSkeleton />
                ) : !referrals || referrals.length === 0 ? (
                  <EmptyState
                    icon={UserPlus}
                    title="No referrals yet"
                    description="Start referring to earn rewards."
                  />
                ) : (
                  <DataTable
                    data={referrals}
                    columns={columns}
                    searchable
                    searchPlaceholder="Search referrals..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === REWARDS PROGRAM === */}
          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Rewards Program
                </CardTitle>
                <CardDescription>
                  How rewards are calculated
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <h3 className="font-semibold text-lg mb-2">
                  How It Works
                </h3>

                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      1
                    </span>
                    Share your code
                  </li>

                  <li className="flex gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      2
                    </span>
                    Your friend signs up
                  </li>

                  <li className="flex gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      3
                    </span>
                    They get accepted and start a contract
                  </li>

                  <li className="flex gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      4
                    </span>
                    You receive your reward
                  </li>
                </ol>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Terms</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Reward paid after contractor is accepted.</li>
                    <li>The referral must be new to the platform.</li>
                    <li>Rewards may change without notice.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}
