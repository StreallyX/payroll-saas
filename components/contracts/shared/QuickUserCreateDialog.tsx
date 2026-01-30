"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone } from "lucide-react";

interface QuickUserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleFilter?: "contractor" | "payroll" | "admin" | "agency";
  onSuccess?: (userId: string) => void;
}

export function QuickUserCreateDialog({
  open,
  onOpenChange,
  roleFilter,
  onSuccess,
}: QuickUserCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch roles to get the correct roleId
  const { data: roles = [] } = api.role.getAll.useQuery(undefined, {
    enabled: open,
  });

  // Find the role that matches the filter
  const targetRole = roles.find((r: any) =>
    r.name.toLowerCase() === roleFilter?.toUpperCase() ||
    r.name.toLowerCase() === roleFilter?.toLowerCase()
  );

  const createMutation = api.user.create.useMutation({
    onSuccess: (data) => {
      toast.success(`${getRoleLabel()} created successfully! Invitation sent.`);
      onSuccess?.(data.id);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create user");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "" });
  };

  const getRoleLabel = () => {
    if (roleFilter === "contractor") return "Contractor";
    if (roleFilter === "agency") return "Agency User";
    if (roleFilter === "payroll") return "Payroll User";
    return "User";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    if (!formData.email) return toast.error("Email is required");
    if (!targetRole) return toast.error(`No ${getRoleLabel()} role found. Please create the role first.`);

    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      roleId: targetRole.id,
      sendInvitation: true,
    });
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create {getRoleLabel()}
          </DialogTitle>
          <DialogDescription>
            Create a new {getRoleLabel().toLowerCase()} quickly. They will receive an invitation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                className="pl-9"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone (optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555..."
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !targetRole}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
