"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2, User, UserCheck, Mail, Info } from "lucide-react"

type AddContactModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName?: string
  onSuccess?: () => void
}

export function AddContactModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  onSuccess,
}: AddContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "contact",
    accessType: "contact",
  })

  const addContactMutation = api.company.addContact.useMutation({
    onSuccess: () => {
      toast.success(formData.accessType === "user" ? "User added! Invitation sent." : "Contact added.")
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add")
    },
  })

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", role: "contact", accessType: "contact" })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error("Name is required")
    if (!formData.email) return toast.error("Email is required")

    addContactMutation.mutate({
      companyId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role as any,
      hasPortalAccess: formData.accessType === "user",
      // No portalRoleId - server will force "agency" role
    })
  }

  const isLoading = addContactMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Add Person</DialogTitle>
          {companyName && <DialogDescription className="text-xs">{companyName}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type Selection */}
          <RadioGroup
            value={formData.accessType}
            onValueChange={(value) => setFormData({ ...formData, accessType: value })}
            className="grid grid-cols-2 gap-2"
          >
            <div>
              <RadioGroupItem value="contact" id="contact" className="peer sr-only" />
              <Label
                htmlFor="contact"
                className="flex items-center justify-center gap-2 rounded border-2 border-muted p-2 text-sm cursor-pointer peer-data-[state=checked]:border-primary"
              >
                <User className="h-4 w-4" />
                Contact
              </Label>
            </div>
            <div>
              <RadioGroupItem value="user" id="user" className="peer sr-only" />
              <Label
                htmlFor="user"
                className="flex items-center justify-center gap-2 rounded border-2 border-muted p-2 text-sm cursor-pointer peer-data-[state=checked]:border-primary"
              >
                <UserCheck className="h-4 w-4" />
                User
              </Label>
            </div>
          </RadioGroup>

          {/* Info for User type */}
          {formData.accessType === "user" && (
            <div className="flex items-center gap-2 p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700">
              <Info className="h-3 w-3 flex-shrink-0" />
              <span>User will have <strong>Agency</strong> role and receive an invitation email.</span>
            </div>
          )}

          {/* Name & Phone in row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555..."
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
              disabled={isLoading}
              className="h-8 text-sm"
            />
          </div>

          {/* Company Role */}
          <div className="space-y-1">
            <Label className="text-xs">Role in Company</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="billing_contact">Billing</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {formData.accessType === "user" ? (
                <><Mail className="mr-1 h-3 w-3" />Send Invite</>
              ) : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
