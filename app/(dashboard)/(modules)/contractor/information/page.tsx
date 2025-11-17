"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { User, Mail, Phone, MapPin, Edit, Save, Briefcase, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Contractor Information Page
 * 
 * Displays and allows editing of the contractor's profile information.
 * Integrated with tRPC for real-time data fetching and updates.
 */

export default function ContractorInformationPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // Fetch contractor data
  const { data: contractor, isLoading, error, refetch } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id }
  );

  // Update mutation
  const updateContractor = api.contractor.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your information has been updated successfully.",
      });
      setIsEditing(false);
      refetch();
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
        address: contractor.address || "",
        city: contractor.city || "",
        state: contractor.state || "",
        zipCode: contractor.zipCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth || "",
        notes: contractor.notes || "",
      });
    }
  }, [contractor]);

  const handleSave = () => {
    if (!contractor?.id || !formData) return;

    updateContractor.mutate({
      id: contractor.id,
      ...formData,
    });
  };

  const handleCancel = () => {
    if (contractor) {
      setFormData({
        name: contractor.user?.name || "",
        email: contractor.user?.email || "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        address: contractor.address || "",
        city: contractor.city || "",
        state: contractor.state || "",
        zipCode: contractor.zipCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth || "",
        notes: contractor.notes || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Information"
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
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Information"
          description="Manage your personal profile and contact information"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Failed to load contractor information. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Information"
        description="Manage your personal profile and contact information"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
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
                Your residential address
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
            <Button variant="outline" onClick={handleCancel} disabled={updateContractor.isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateContractor.isLoading}>
              {updateContractor.isLoading ? (
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
            Edit Information
          </Button>
        )}
      </div>

      {/* Contracts Summary */}
      {contractor.contracts && contractor.contracts.length > 0 && (
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
  );
}