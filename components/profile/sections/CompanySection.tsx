// components/profile/sections/CompanySection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, Save, Building2 } from "lucide-react";
import type { CompanyFormData } from "@/hooks/useProfile";

type Props = {
  form: CompanyFormData | null;
  setForm: (f: CompanyFormData) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  hasCompany: boolean;
};

export function CompanySection({
  form,
  setForm,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  saving,
  hasCompany,
}: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company
          </CardTitle>
          <CardDescription>The company you are attached to (if any)</CardDescription>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {hasCompany ? "Edit" : "Create"}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {!form ? (
          <p className="text-sm text-muted-foreground">No company information available.</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={form.contactPerson || ""}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  value={form.contactEmail || ""}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={form.contactPhone || ""}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Office Building</Label>
                <Input
                  value={form.officeBuilding || ""}
                  onChange={(e) => setForm({ ...form, officeBuilding: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input
                value={form.address1 || ""}
                onChange={(e) => setForm({ ...form, address1: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={form.address2 || ""}
                onChange={(e) => setForm({ ...form, address2: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city || ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Post Code</Label>
                <Input
                  value={form.postCode || ""}
                  onChange={(e) => setForm({ ...form, postCode: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Country ID</Label>
                <Input
                  value={form.countryId || ""}
                  onChange={(e) => setForm({ ...form, countryId: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={form.website || ""}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoicing Contact Name</Label>
                <Input
                  value={form.invoicingContactName || ""}
                  onChange={(e) => setForm({ ...form, invoicingContactName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoicing Contact Phone</Label>
                <Input
                  value={form.invoicingContactPhone || ""}
                  onChange={(e) => setForm({ ...form, invoicingContactPhone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoicing Contact Email</Label>
                <Input
                  value={form.invoicingContactEmail || ""}
                  onChange={(e) => setForm({ ...form, invoicingContactEmail: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Alternate Invoicing Email</Label>
                <Input
                  value={form.alternateInvoicingEmail || ""}
                  onChange={(e) => setForm({ ...form, alternateInvoicingEmail: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>VAT Number</Label>
              <Input
                value={form.vatNumber || ""}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={onSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Company
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
