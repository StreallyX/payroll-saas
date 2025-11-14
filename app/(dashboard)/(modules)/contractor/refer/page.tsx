
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { UserPlus, Copy, Mail, Gift, Share2, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Contractor Referral Page
 * 
 * This page allows contractors to refer friends and earn rewards.
 * 
 * TODO:
 * - Implement tRPC mutation to send referral invitations
 * - Add referral tracking and status
 * - Implement reward calculation system
 * - Add social sharing functionality
 * - Implement email invitation system
 * - Add referral analytics and reports
 * - Show referral terms and conditions
 * - Implement referral code generation
 */

// Mock data - TODO: Replace with real data from tRPC
const mockReferrals = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "completed",
    referralDate: "2024-01-10",
    hireDate: "2024-01-25",
    reward: "$500",
  },
  {
    id: "2",
    name: "Bob Williams",
    email: "bob@example.com",
    status: "hired",
    referralDate: "2024-01-15",
    hireDate: "2024-02-01",
    reward: "Pending",
  },
  {
    id: "3",
    name: "Carol Martinez",
    email: "carol@example.com",
    status: "invited",
    referralDate: "2024-01-20",
    hireDate: null,
    reward: "-",
  },
];

export default function ContractorReferPage() {
  const [referralCode] = useState("JOHN-REF-2024");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      completed: { variant: "default", label: "Reward Earned" },
      hired: { variant: "secondary", label: "Hired" },
      invited: { variant: "secondary", label: "Invited" },
      rejected: { variant: "destructive", label: "Not Hired" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalRewards = "$500";
  const pendingRewards = "$500";
  const totalReferrals = "3";
  const successfulHires = "2";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer a Friend"
        description="Earn rewards by referring talented contractors to our platform"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Rewards</CardDescription>
            <CardTitle className="text-3xl">{totalRewards}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-3xl">{pendingRewards}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{totalReferrals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful Hires</CardDescription>
            <CardTitle className="text-3xl">{successfulHires}</CardTitle>
          </CardHeader>
        </Card>
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
                <div className="space-y-2">
                  <Label>Your Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="font-mono text-lg"
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
                      value={`https://platform.com/signup?ref=${referralCode}`}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://platform.com/signup?ref=${referralCode}`
                        );
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                  <Label htmlFor="friendName">Friend's Name</Label>
                  <Input id="friendName" placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="friendEmail">Friend's Email</Label>
                  <Input
                    id="friendEmail"
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                  <Input
                    id="personalMessage"
                    placeholder="I think you'd be a great fit..."
                  />
                </div>

                <Button className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Referral Date</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.name}</TableCell>
                        <TableCell>{referral.email}</TableCell>
                        <TableCell>{referral.referralDate}</TableCell>
                        <TableCell>{referral.hireDate || "-"}</TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell className="font-semibold">
                          {referral.reward}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                <h3 className="mb-3 font-semibold">How It Works</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">1.</span>
                    Share your unique referral code or link with friends
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">2.</span>
                    Your friend signs up and completes onboarding
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">3.</span>
                    Your friend completes their first 90 days of work
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">4.</span>
                    You receive your referral reward
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Reward Tiers</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      1st Successful Referral
                    </span>
                    <span className="font-semibold">$500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      2nd Successful Referral
                    </span>
                    <span className="font-semibold">$750</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      3+ Successful Referrals
                    </span>
                    <span className="font-semibold">$1,000 each</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Referral rewards are paid after the referred contractor completes
                  90 days of continuous work. The referred person must be a new
                  contractor who has never worked with the platform before. Rewards
                  are subject to change and may be discontinued at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
