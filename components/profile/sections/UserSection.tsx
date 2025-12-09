"use client";

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
import {
  Globe,
  Mail,
  Phone,
  Save,
  Edit,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import type { UserFormData } from "@/hooks/useProfile";

type Props = {
  form: UserFormData;
  setForm: (f: UserFormData) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean; // <-- AJOUT
};

export function UserSection({
  form,
  setForm,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  saving,
}: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Your basic profile details</CardDescription>
        </div>

        {!isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* FULL NAME */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" className="pl-9" value={form.email} disabled />
          </div>
        </div>

        {/* PHONE */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              className="pl-9"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* LANGUAGE */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        {/* TIMEZONE */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="timezone"
              className="pl-9"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* ACTIONS */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>

            <Button onClick={onSave} disabled={saving}>
              {saving ? (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
