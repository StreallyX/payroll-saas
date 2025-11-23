// components/profile/sections/BankSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, Save, Landmark } from "lucide-react";
import type { BankFormData } from "@/hooks/useProfile";

type Props = {
  form: BankFormData | null;
  setForm: (f: BankFormData) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  hasBank: boolean;
};

export function BankSection({
  form,
  setForm,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  saving,
  hasBank,
}: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank Details
          </CardTitle>
          <CardDescription>Your bank information for payments</CardDescription>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {hasBank ? "Edit" : "Create"}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {!form ? (
          <p className="text-sm text-muted-foreground">No bank information available.</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={form.accountNumber || ""}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={form.iban || ""}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>SWIFT/BIC</Label>
              <Input
                value={form.swiftCode || ""}
                onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Bank Address</Label>
              <Input
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                  Save Bank
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
