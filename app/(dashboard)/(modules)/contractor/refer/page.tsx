"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { UserPlus, Copy, Mail, Gift, Share2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";
import { StatsCardSkeleton, TableSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Contractor Referral Page
 * 
 * Allows contractors to refer friends and earn rewards.
 * Features referral code generation, tracking, and reward management.
 */

export default function ContractorReferPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    referredName: "",
    referredEmail: "",
    personalMessage: "",
  });

  // Fetch referral code
  const { data: referralCode, isLoading: codeLoading } = api.referral.getMyReferralCode.useQuery();

  // Fetch referrals
  const { data: referrals, isLoading: referralsLoading, error: referralsError } = api.referral.getMyReferrals.useQuery();

  // Fetch referral stats
  const { data: stats } = api.referral.getMyReferralStats.useQuery();

  // Send invitation mutation
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

  const handleCopyCode = () => {
    if (referralCode?.referralCode) {
      navigator.clipboard.writeText(referralCode.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralCode?.referralLink) {
      navigator.clipboard.writeText(referralCode.referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  const handleSendInvitation = () => {
    if (!inviteForm.referredEmail || !inviteForm.referredName) {
      toast({
        title: "Validation Error",
        description: "Please provide name and email.",
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

  // Referral columns
  const columns: Column<any>[] = [
    {
      key: "referredName",
      label: "Name",
      render: (referral) => <span className="font-medium">{referral.referredName || referral.referredEmail}</span>,
    },
    {
      key: "referredEmail",
      label: "Email",
      render: (referral) => referral.referredEmail,
    },
    {
      key: "invitedAt",
      label: "Referral Date",
      sortable: true,
      render: (referral) => new Date(referral.invitedAt).toLocaleDateString(),
    },
    {
      key: "hiredAt",
      label: "Hire Date",
      sortable: true,
      render: (referral) => referral.hiredAt ? new Date(referral.hiredAt).toLocaleDateString() : "-",
    },
    {
      key: "status",
      label: "Status",
      render: (referral) => <StatusBadge status={referral.status} />,
    },
    {
      key: "rewardAmount",
      label: "Reward",
      sortable: true,
      render: (referral) => referral.rewardAmount ? (
        <span className="font-semibold text-green-600">
          ${parseFloat(referral.rewardAmount).toFixed(2)}
        </span>
      ) : (
        <span className="text-muted-foreground">Pending</span>
      ),
    },
  ];

  // Calculate status badges
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; description: string }> = {
      invited: { label: "Invited", description: "Friend has been invited" },
      signed_up: { label: "Signed Up", description: "Friend has signed up" },
      hired: { label: "Hired", description: "Friend has been hired" },
      completed: { label: "Reward Earned", description: "Reward has been processed" },
      rejected: { label: "Not Hired", description: "Application was not successful" },
    };
    return statusMap[status] || { label: status, description: "" };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer a Friend"
        description="Earn rewards by referring talented contractors to our platform"
      />

      {/* Stats Cards */}
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
              value={`$${stats.totalRewards?.toFixed(2) || '0.00'}`}
              icon={Gift}
            />
            <StatsCard
              title="Pending Rewards"
              value={`$${stats.pendingRewards?.toFixed(2) || '0.00'}`}
              icon={Gift}
              description={`${stats.byStatus.invited || 0} pending`}
            />
            <StatsCard
              title="Total Referrals"
              value={stats.totalReferrals || 0}
              icon={UserPlus}
            />
            <StatsCard
              title="Successful Hires"
              value={stats.successfulHires || 0}
              icon={CheckCircle}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="invite" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invite">Send Invitation</TabsTrigger>
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Program</TabsTrigger>
        </TabsList>

        {/* Send Invitation Tab */}
        <TabsContent value="invite">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Your Referral Code
                </CardTitle>
                <CardDescription>
                  Share your unique referral code with friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {codeLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ) : referralCode ? (
                  <>
                    <div className="space-y-2">
                      <Label>Your Referral Code</Label>
                      <div className="flex gap-2">
                        <Input
                          value={referralCode.referralCode}
                          readOnly
                          className="font-mono text-lg font-semibold"
                        />
                        <Button onClick={handleCopyCode}>
                          {copied ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this code with friends when they sign up
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Referral Link</Label>
                      <div className="flex gap-2">
                        <Input
                          value={referralCode.referralLink}
                          readOnly
                          className="text-sm"
                        />
                        <Button onClick={handleCopyLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to load referral code. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Invite by Email
                </CardTitle>
                <CardDescription>
                  Send a personal invitation via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="friendName">Friend's Name *</Label>
                  <Input
                    id="friendName"
                    placeholder="John Doe"
                    value={inviteForm.referredName}
                    onChange={(e) => setInviteForm({ ...inviteForm, referredName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="friendEmail">Friend's Email *</Label>
                  <Input
                    id="friendEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={inviteForm.referredEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, referredEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                  <Input
                    id="personalMessage"
                    placeholder="I think you'd be a great fit..."
                    value={inviteForm.personalMessage}
                    onChange={(e) => setInviteForm({ ...inviteForm, personalMessage: e.target.value })}
                  />
                </div>

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

        {/* My Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>
                Track the status of your referrals and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{referralsError.message}</AlertDescription>
                </Alert>
              )}

              {referralsLoading ? (
                <TableSkeleton />
              ) : !referrals || referrals.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No referrals yet"
                  description="Start referring friends to earn rewards. Each successful hire can earn you up to $1,000!"
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

        {/* Rewards Program Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Referral Rewards Program
              </CardTitle>
              <CardDescription>
                Learn how our referral program works and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold text-lg">How It Works</h3>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Share your referral code or link</p>
                      <p className="text-sm text-muted-foreground">
                        Send your unique code to friends who might be interested in joining
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Your friend signs up</p>
                      <p className="text-sm text-muted-foreground">
                        They create an account and complete their onboarding process
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Your friend gets hired</p>
                      <p className="text-sm text-muted-foreground">
                        They complete their first 90 days of continuous work
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      4
                    </span>
                    <div>
                      <p className="font-medium">You receive your reward</p>
                      <p className="text-sm text-muted-foreground">
                        Your referral bonus is processed and added to your next payment
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border-2 border-primary/20 p-5">
                <h3 className="mb-4 font-semibold text-lg">Reward Tiers</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">1st Successful Referral</p>
                      <p className="text-sm text-muted-foreground">Your first hire</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">$500</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">2nd Successful Referral</p>
                      <p className="text-sm text-muted-foreground">Your second hire</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">$750</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                    <div>
                      <p className="font-medium">3+ Successful Referrals</p>
                      <p className="text-sm text-muted-foreground">Each additional hire</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">$1,000</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Terms & Conditions</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Referral rewards are paid after the referred contractor completes 90 days of continuous work</li>
                  <li>The referred person must be a new contractor who has never worked with the platform before</li>
                  <li>Multiple referrals from the same contractor are allowed and encouraged</li>
                  <li>Rewards are subject to change and may be discontinued at any time</li>
                  <li>Self-referrals are not permitted and will void any rewards</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
