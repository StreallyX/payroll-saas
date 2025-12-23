"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  UserCog,
  Building,
  Phone,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [impersonating, setImpersonating] = useState(false);

  const { data: user, isLoading, error } = api.user.getDetails.useQuery({ id: userId });
  const impersonateMutation = api.user.impersonate.useMutation();

  const handleImpersonate = async () => {
    try {
      setImpersonating(true);
      const result = await impersonateMutation.mutateAsync({ targetUserId: userId });
      
      if (result.success) {
        // Log out current user and log in as target user
        // This would require custom NextAuth implementation
        alert("Impersonation feature requires custom NextAuth session handling. For now, this logs the action.");
        // In a real implementation, you would:
        // 1. End current session
        // 2. Create new session as target user
        // 3. Store original user ID for "exit impersonation"
      }
    } catch (error) {
      console.error("Impersonation failed:", error);
      alert("Failed to impersonate user: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setImpersonating(false);
    }
  };

  if (isLoading) {
    return (
      <RouteGuard permission="user.list.global">
        <PageHeader title="User Profile" description="Loading..." />
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading user details...</div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !user) {
    return (
      <RouteGuard permission="user.list.global">
        <PageHeader title="User Profile" description="Error loading user" />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.message || "Failed to load user profile."}
          </AlertDescription>
        </Alert>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="user.list.global">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/users")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
          <div className="flex gap-2">
            {user.canViewFullDetails && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/users/${userId}/delegated-access`)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Access
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImpersonate}
                  disabled={impersonating}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  {impersonating ? "Impersonating..." : "Impersonate User"}
                </Button>
              </>
            )}
          </div>
        </div>

        <PageHeader
          title={user.name || "User Profile"}
          description={`View and manage user details for ${user.email}`}
        />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                <div className="text-base">{user.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                <div className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Role</div>
                <Badge variant="outline">{user.role?.displayName || user.role?.name}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created At</div>
                <div className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              {user.createdByUser && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Created By</div>
                  <div className="text-base">{user.createdByUser.name || user.createdByUser.email}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Status */}
        {user.onboardingProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Onboarding Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{user.onboardingProgress.percentage}%</span>
                </div>
                <Progress value={user.onboardingProgress.percentage} className="h-2" />
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{user.onboardingProgress.total}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user.onboardingProgress.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{user.onboardingProgress.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{user.onboardingProgress.rejected}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Onboarding Status</div>
                <Badge
                  variant={
                    user.onboardingProgress.status === "completed"
                      ? "default"
                      : user.onboardingProgress.status === "pending"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {user.onboardingProgress.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details (Only for global permissions) */}
        {user.canViewFullDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
                    <div className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </div>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</div>
                    <div className="text-base">{formatDate(user.dateOfBirth)}</div>
                  </div>
                )}
                {user.country && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Country</div>
                    <div className="text-base">{user.country.name}</div>
                  </div>
                )}
                {user.city && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">City</div>
                    <div className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4" />
                      {user.city}
                    </div>
                  </div>
                )}
                {user.address1 && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Address</div>
                    <div className="text-base">
                      {user.address1}
                      {user.address2 && `, ${user.address2}`}
                    </div>
                  </div>
                )}
                {user.companyName && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Company</div>
                    <div className="text-base">{user.companyName}</div>
                  </div>
                )}
                {user.vatNumber && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">VAT Number</div>
                    <div className="text-base">{user.vatNumber}</div>
                  </div>
                )}
                {user.lastLoginAt && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Last Login</div>
                    <div className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      {formatDate(user.lastLoginAt)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Access Restricted Notice */}
        {!user.canViewFullDetails && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You have limited access to this user's profile. Contact an administrator for full access.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </RouteGuard>
  );
}
