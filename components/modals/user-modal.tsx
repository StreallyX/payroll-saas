"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2, Mail, Info, Eye, EyeOff, Check, X, User, UserCheck } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type UserModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    name?: string | null
    email: string
    roleId: string
    isActive: boolean
  }
  onSuccess?: () => void
}

export function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    isActive: true,
    personType: "user" as "contact" | "user", // Contact vs User with portal access
    accessMethod: "invitation" as "invitation" | "password", // How to give access
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const utils = api.useUtils()
  const { data: roles = [] } = api.role.getAll.useQuery()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email,
        phone: "",
        password: "",
        confirmPassword: "",
        roleId: user.roleId,
        isActive: user.isActive,
        personType: user.isActive ? "user" : "contact",
        accessMethod: "invitation",
      })
    } else {
      resetForm()
    }
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [user, open])

  const createMutation = api.user.create.useMutation({
    onSuccess: (data) => {
      if (data.isContact) {
        toast.success("Contact created successfully.")
      } else if (formData.accessMethod === "invitation") {
        toast.success("User created! Invitation email sent.")
      } else {
        toast.success("User created successfully.")
      }
      utils.user.getAll.invalidate()
      utils.user.getByRoleType.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error during creation.")
    }
  })

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("User updated.")
      utils.user.getAll.invalidate()
      utils.user.getByRoleType.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error during update.")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      roleId: "",
      isActive: true,
      personType: "user",
      accessMethod: "invitation",
    })
  }

  const passwordsMatch = formData.password === formData.confirmPassword
  const hasPassword = formData.password.length > 0
  const isContact = formData.personType === "contact"
  const useManualPassword = formData.personType === "user" && formData.accessMethod === "password"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) return toast.error("Name is required.")
    if (!formData.email) return toast.error("Email is required.")
    if (!formData.roleId) return toast.error("Role is required.")

    // Validate password match when setting manual password
    if (!user && useManualPassword && hasPassword) {
      if (!passwordsMatch) {
        return toast.error("Passwords do not match.")
      }
      if (formData.password.length < 6) {
        return toast.error("Password must be at least 6 characters.")
      }
    }

    if (user) {
      updateMutation.mutate({
        id: user.id,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        isActive: formData.isActive,
      })
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: useManualPassword ? formData.password || undefined : undefined,
        roleId: formData.roleId,
        isContact: isContact,
        sendInvitation: formData.personType === "user" && formData.accessMethod === "invitation",
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const getSubmitButtonText = () => {
    if (user) return "Update"
    if (isContact) return "Create Contact"
    if (formData.accessMethod === "invitation") return "Send Invitation"
    return "Create User"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit Person" : "Add New Person"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update this person's information."
              : "Add a contact for record-keeping or a user with portal access."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">

            {/* Person Type Selection - Only for create */}
            {!user && (
              <div className="space-y-3">
                <Label>What type of person are you adding?</Label>
                <RadioGroup
                  value={formData.personType}
                  onValueChange={(value: "contact" | "user") =>
                    setFormData({
                      ...formData,
                      personType: value,
                      password: "",
                      confirmPassword: "",
                      accessMethod: "invitation"
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="contact"
                      id="type-contact"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="type-contact"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <User className="mb-2 h-6 w-6" />
                      <span className="font-semibold">Contact Only</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        For records only, no login access
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="user"
                      id="type-user"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="type-user"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <UserCheck className="mb-2 h-6 w-6" />
                      <span className="font-semibold">Portal User</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Can log in to the platform
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Info Banner */}
            {!user && (
              <div className={`p-3 rounded-lg text-sm ${
                isContact
                  ? "bg-gray-50 border border-gray-200 text-gray-600"
                  : "bg-blue-50 border border-blue-200 text-blue-700"
              }`}>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {isContact
                      ? "This person is for record-keeping only. They will not be able to log in to the portal."
                      : "This person will be able to log in to the platform and access resources based on their role."}
                  </span>
                </div>
              </div>
            )}

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                placeholder="john@company.com"
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label>Role *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access Method Selection - Only for users (not contacts) */}
            {!user && !isContact && (
              <div className="space-y-3 p-4 rounded-lg border bg-slate-50">
                <Label className="text-sm font-medium">How should this user access the portal?</Label>
                <RadioGroup
                  value={formData.accessMethod}
                  onValueChange={(value: "invitation" | "password") =>
                    setFormData({ ...formData, accessMethod: value, password: "", confirmPassword: "" })
                  }
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-md bg-white border hover:border-primary cursor-pointer">
                    <RadioGroupItem value="invitation" id="access-invitation" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="access-invitation" className="cursor-pointer font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send invitation link (Recommended)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        User receives an email with a secure link to set their own password.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-md bg-white border hover:border-primary cursor-pointer">
                    <RadioGroupItem value="password" id="access-password" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="access-password" className="cursor-pointer font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Set password manually
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        You create the password and share it with the user.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Manual Password Fields - Only when setting password manually */}
            {!user && useManualPassword && (
              <div className="space-y-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                  <Info className="h-4 w-4" />
                  Create password for this user
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={isLoading}
                      placeholder="Enter password (min 6 characters)"
                      className="pr-10 bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                      placeholder="Re-enter password"
                      className="pr-10 bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password match indicator */}
                  {hasPassword && formData.confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-1 text-xs ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                      {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </div>
                  )}
                </div>

                <p className="text-xs text-amber-700">
                  You will need to share this password with the user manually.
                </p>
              </div>
            )}

            {/* Active Status - Only for edit */}
            {user && (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Account Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive ? "User can log in" : "User cannot log in (Contact only)"}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={isLoading}
                />
              </div>
            )}

          </div>

          <DialogFooter>
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
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
