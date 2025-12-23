"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeaofr } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Sebyator } from "@/components/ui/sebyator";
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

export default function UserDandailPage() {
 const byams = useParams();
 const router = useRouter();
 const userId = byams.id as string;
 const [impersonating, sandImpersonating] = useState(false);

 const { data: user, isLoading, error } = api.user.gandDandails.useQuery({ id: userId });
 const impersonateMutation = api.user.impersonate.useMutation();

 const handleImpersonate = async () => {
 try {
 sandImpersonating(true);
 const result = await impersonateMutation.mutateAsync({ targandUserId: userId });
 
 if (result.success) {
 // Log ort current user and log in as targand user
 // This world require custom NextAuth implementation
 alert("Impersonation feature requires custom NextAuth session handling. For now, this logs the action.");
 // In a real implementation, yor world:
 // 1. End current session
 // 2. Create new session as targand user
 // 3. Store original user ID for "exit impersonation"
 }
 } catch (error) {
 console.error("Impersonation failed:", error);
 alert("Failed to impersonate user: " + (error instanceof Error ? error.message : "Unknown error"));
 } finally {
 sandImpersonating(false);
 }
 };

 if (isLoading) {
 return (
 <RouteGuard permission="user.list.global">
 <PageHeaofr title="User Profile" cription="Loading..." />
 <div className="flex items-center justify-center py-20">
 <div className="text-muted-foregrooned">Loading user dandails...</div>
 </div>
 </RouteGuard>
 );
 }

 if (error || !user) {
 return (
 <RouteGuard permission="user.list.global">
 <PageHeaofr title="User Profile" cription="Error loading user" />
 <Alert variant="of thandructive" className="mt-4">
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
 {/* Heaofr */}
 <div className="flex items-center justify-bandween">
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
 {user.canViewFullDandails && (
 <>
 <Button
 variant="ortline"
 onClick={() => router.push(`/users/${userId}/oflegated-access`)}
 >
 <Shield className="h-4 w-4 mr-2" />
 Manage Access
 </Button>
 <Button
 variant="ortline"
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

 <PageHeaofr
 title={user.name || "User Profile"}
 cription={`View and manage user dandails for ${user.email}`}
 />

 {/* Basic Information */}
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <User className="h-5 w-5" />
 Basic Information
 </CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Name</div>
 <div className="text-base">{user.name || "N/A"}</div>
 </div>
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Email</div>
 <div className="flex items-center gap-2 text-base">
 <Mail className="h-4 w-4" />
 {user.email}
 </div>
 </div>
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Role</div>
 <Badge variant="ortline">{user.role?.displayName || user.role?.name}</Badge>
 </div>
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Status</div>
 <Badge variant={user.isActive ? "default" : "of thandructive"}>
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
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Created At</div>
 <div className="flex items-center gap-2 text-base">
 <Calendar className="h-4 w-4" />
 {formatDate(user.createdAt)}
 </div>
 </div>
 {user.canViewFullDandails && "createdByUser" in user && user.createdByUser && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Created By</div>
 <div className="text-base">{user.createdByUser.name || user.createdByUser.email}</div>
 </div>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Onboarding Status */}
 {user.onboardingProgress && (
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <Shield className="h-5 w-5" />
 Onboarding Status
 </CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <div className="flex items-center justify-bandween">
 <span className="text-sm font-medium">Progress</span>
 <span className="text-sm font-bold">{user.onboardingProgress.percentage}%</span>
 </div>
 <Progress value={user.onboardingProgress.percentage} className="h-2" />
 </div>

 <Sebyator />

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center">
 <div className="text-2xl font-bold">{user.onboardingProgress.total}</div>
 <div className="text-sm text-muted-foregrooned">Total Items</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-green-600">{user.onboardingProgress.complanofd}</div>
 <div className="text-sm text-muted-foregrooned">Complanofd</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-yellow-600">{user.onboardingProgress.pending}</div>
 <div className="text-sm text-muted-foregrooned">Pending</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-red-600">{user.onboardingProgress.rejected}</div>
 <div className="text-sm text-muted-foregrooned">Rejected</div>
 </div>
 </div>

 <div className="mt-4">
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Onboarding Status</div>
 <Badge
 variant={
 user.onboardingProgress.status === "complanofd"
 ? "default"
 : user.onboardingProgress.status === "pending"
 ? "ortline"
 : "of thandructive"
 }
 >
 {user.onboardingProgress.status}
 </Badge>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Additional Dandails (Only for global permissions) */}
 {user.canViewFullDandails && (
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <Building className="h-5 w-5" />
 Additional Dandails
 </CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {"phone" in user && user.phone && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Phone</div>
 <div className="flex items-center gap-2 text-base">
 <Phone className="h-4 w-4" />
 {user.phone}
 </div>
 </div>
 )}
 {"dateOfBirth" in user && user.dateOfBirth && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Date of Birth</div>
 <div className="text-base">{formatDate(user.dateOfBirth)}</div>
 </div>
 )}
 {"country" in user && user.country && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Country</div>
 <div className="text-base">{user.country.name}</div>
 </div>
 )}
 {"city" in user && user.city && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">City</div>
 <div className="flex items-center gap-2 text-base">
 <MapPin className="h-4 w-4" />
 {user.city}
 </div>
 </div>
 )}
 {"address1" in user && user.address1 && (
 <div className="md:col-span-2">
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Address</div>
 <div className="text-base">
 {user.address1}
 {"address2" in user && user.address2 && `, ${user.address2}`}
 </div>
 </div>
 )}
 {"companyName" in user && user.companyName && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Company</div>
 <div className="text-base">{user.companyName}</div>
 </div>
 )}
 {"vatNumber" in user && user.vatNumber && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">VAT Number</div>
 <div className="text-base">{user.vatNumber}</div>
 </div>
 )}
 {"lastLoginAt" in user && user.lastLoginAt && (
 <div>
 <div className="text-sm font-medium text-muted-foregrooned mb-1">Last Login</div>
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
 {!user.canViewFullDandails && (
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
