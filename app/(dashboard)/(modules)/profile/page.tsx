"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { User, Mail, Phone, MapPin, Edit, Save, Briefcase, Calendar, AlertCircle, Loader2, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteGuard } from "@/components/guards/RouteGuard";

/**
 * Unified Profile Page
 * 
 * This page serves all user types (Contractor, Agency, Payroll Partner, Admin, etc.)
 * It displays and allows editing of the user's profile information.
 * 
 * Permission Required: profile.view
 * Edit Permission: profile.update
 * 
 * Migration Note:
 * - Replaces: /contractor/information
 * - Replaces: /agency/information
 * - Replaces: /payroll-partner/information
 */

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // Determine user type based on session
  const userType = session?.user?.role?.name || "user";
  const isContractor = userType.toLowerCase().includes("contractor");
  const isAgency = userType.toLowerCase().includes("agency");

  // Fetch contractor data if user is a contractor
  const { data: contractor, isLoading: contractorLoading, error: contractorError, refetch: refetchContractor } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id && isContractor }
  );

  // TODO: Add agency query here when implemented
  // const { data: agency, isLoading: agencyLoading, error: agencyError, refetch: refetchAgency } = api.agency.getByUserId.useQuery(...)

  // Update mutation for contractor
  const updateContractor = api.contractor.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your information has been updated successfully.",
      });
      setIsEditing(false);
      refetchContractor();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update information.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when contractor data loads
  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.user?.name || "",
        email: contractor.user?.email || "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        address: contractor.address1 || "",
        city: contractor.city || "",
        state: contractor.state || "",
        zipCode: contractor.postCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth || "",
        notes: contractor.notes || "",
      });
    }
  }, [contractor]);

  const handleSave = () => {
    if (!formData) return;

    if (isContractor && contractor?.id) {
      updateContractor.mutate({
        id: contractor.id,
        ...formData,
      });
    }
    // TODO: Add agency update logic here
  };

  const handleCancel = () => {
    if (contractor) {
      setFormData({
        name: contractor.user?.name || "",
        email: contractor.user?.email || "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        address: contractor.address1 || "",
        city: contractor.city || "",
        state: contractor.state || "",
        zipCode: contractor.postCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth || "",
        notes: contractor.notes || "",
      });
    }
    setIsEditing(false);
  };

  const isLoading = contractorLoading; // || agencyLoading
  const error = contractorError; // || agencyError

  if (isLoading) {
    return (
      <RouteGuard permission="profile.view">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile and contact information"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSkeleton />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
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

  if (error || (!contractor && isContractor)) {
    return (
      <RouteGuard permission="profile.view">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile and contact information"
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || "Failed to load profile information. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </RouteGuard>
    );
  }

  if (!formData) return null;

  return (
    <RouteGuard permission="profile.view">
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your personal profile and contact information"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isAgency ? (
                  <>
                    <Building2 className="h-5 w-5" />
                    Organization Information
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5" />
                    Personal Information
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isAgency ? "Your organization's basic details" : "Your basic profile details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{isAgency ? "Organization Name" : "Full Name"}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-9"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {!isAgency && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="alternatePhone"
                        type="tel"
                        className="pl-9"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-9"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Address & Notes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  {isAgency ? "Your organization's address" : "Your residential address"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Additional Notes
                </CardTitle>
                <CardDescription>
                  Additional information or notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Any additional information..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={updateContractor.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateContractor.isPending}>
                {updateContractor.isPending ? (
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

        {/* Contracts Summary (Contractor only) */}
        {isContractor && contractor?.contracts && contractor.contracts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>
                Your current contracts and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractor.contracts.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contract.contractReference || "Contract"}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.agency?.name || "Direct Contract"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{contract.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
