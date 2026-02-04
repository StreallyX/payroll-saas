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
import { getErrorMessage } from "@/lib/error-utils"
import { Loader2, User, UserCheck, Mail, Info } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "contact",
    accessType: "contact",
    jobTitle: "",
    department: "",
    notes: "",
  })

  const addContactMutation = api.company.addContact.useMutation({
    onSuccess: () => {
      toast.success(formData.accessType === "user" ? "User added! Invitation sent." : "Contact added.")
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "contact",
      accessType: "contact",
      jobTitle: "",
      department: "",
      notes: "",
    })
  }

  // Helper to capitalize names properly (e.g., "phil roebuck" -> "Phil Roebuck")
  const formatName = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName) return toast.error("First name is required")
    if (!formData.lastName) return toast.error("Last name is required")
    if (!formData.email) return toast.error("Email is required")

    // Combine and format name
    const fullName = formatName(`${formData.firstName} ${formData.lastName}`)

    addContactMutation.mutate({
      companyId,
      name: fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role as any,
      hasPortalAccess: formData.accessType === "user",
      jobTitle: formData.jobTitle || undefined,
      department: formData.department || undefined,
      notes: formData.notes || undefined,
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

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-2">
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

          {/* Job Title & Department */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Job Title</Label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g. HR Manager"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Human Resources"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
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

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. In charge of all contract recruitment in USA and Canada"
              disabled={isLoading}
              className="text-sm min-h-[60px] resize-none"
            />
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
