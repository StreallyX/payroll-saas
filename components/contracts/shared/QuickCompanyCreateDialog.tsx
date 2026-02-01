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
import { Loader2, Building2, Mail, Phone, Globe } from "lucide-react";

interface QuickCompanyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerType?: "tenant" | "user";
  onSuccess?: (companyId: string) => void;
}

export function QuickCompanyCreateDialog({
  open,
  onOpenChange,
  ownerType = "user",
  onSuccess,
}: QuickCompanyCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    vatNumber: "",
  });

  const createMutation = api.company.create.useMutation({
    onSuccess: (data) => {
      toast.success("Company created successfully!");
      onSuccess?.(data.id);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create company");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      vatNumber: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Company name is required");

    createMutation.mutate({
      name: formData.name,
      ownerType,
      contactPerson: formData.contactPerson || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      vatNumber: formData.vatNumber || undefined,
    });
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Company
          </DialogTitle>
          <DialogDescription>
            Create a new company quickly. You can add more details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corporation"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  className="pl-9"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@..."
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 555..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>VAT / Tax Number</Label>
            <Input
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              placeholder="VAT123456"
              disabled={isLoading}
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
