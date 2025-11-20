"use client";

import { useSession } from "next-auth/react";
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
  User,
  Mail,
  Phone,
  Edit,
  Save,
  AlertCircle,
  Loader2,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteGuard } from "@/components/guards/RouteGuard";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // 🔥 NEW: Fetch the USER profile (not contractor)
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = api.profile.getOwn.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  // 🔥 NEW: Update mutation for USER
  const updateProfile = api.profile.updateOwn.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully." });
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Update failed.",
        variant: "destructive",
      });
    },
  });

  // 🔥 Initialize form with USER data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        timezone: user.timezone || "UTC",
        language: user.language || "en",
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <RouteGuard permission="user.read.own">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile information"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !user) {
    return (
      <RouteGuard permission="user.read.own">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile information"
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || "Failed to load profile."}
            </AlertDescription>
          </Alert>
        </div>
      </RouteGuard>
    );
  }

  if (!formData) return null;

  // 🔥 Save logic
  const handleSave = () => {
    updateProfile.mutate({
      name: formData.name,
      phone: formData.phone,
      timezone: formData.timezone,
      language: formData.language,
    });
  };

  // 🔥 Reset logic
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        timezone: user.timezone || "UTC",
        language: user.language || "en",
      });
    }
    setIsEditing(false);
  };

  return (
    <RouteGuard permission="user.read.own">
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your personal profile and contact information"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-9"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="timezone"
                  className="pl-9"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
