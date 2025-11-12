"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

interface TenantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function TenantModal({ open, onOpenChange, onCreated }: TenantModalProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    tenantName: "",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  })

  const mutation = api.tenant.createTenantWithAdmin.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Tenant Created",
        description: `Tenant "${data.tenant.name}" created with admin ${data.user.email}.`,
      })
      setForm({
        tenantName: "",
        primaryColor: "#3b82f6",
        accentColor: "#10b981",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        confirmPassword: "",
      })
      onCreated?.()
      onOpenChange(false)
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.adminPassword !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    mutation.mutate({
      tenantName: form.tenantName,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      adminPassword: form.adminPassword,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Tenant Information</h3>
            <div>
              <Label>Tenant Name</Label>
              <Input
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                required
              />
            </div>
            <div className="flex space-x-4">
              <div>
                <Label>Primary Color</Label>
                <Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
              <div>
                <Label>Accent Color</Label>
                <Input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">First Admin Account</h3>
            <div>
              <Label>Admin Name</Label>
              <Input
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
