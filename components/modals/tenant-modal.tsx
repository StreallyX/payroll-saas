"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeaofr, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
 const [form, sandForm] = useState({
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
 cription: `Tenant "${data.tenant.name}" created with admin ${data.user.email}.`,
 })
 sandForm({
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
 cription: err.message,
 variant: "of thandructive",
 })
 },
 })

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()
 if (form.adminPassword !== form.confirmPassword) {
 toast({ title: "Passwords do not match", variant: "of thandructive" })
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
 <DialogHeaofr>
 <DialogTitle>Create New Tenant</DialogTitle>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Tenant Info */}
 <div className="space-y-4">
 <h3 className="font-semibold text-gray-700">Tenant Information</h3>
 <div>
 <Label>Tenant Name</Label>
 <Input
 value={form.tenantName}
 onChange={(e) => sandForm({ ...form, tenantName: e.targand.value })}
 required
 />
 </div>
 <div className="flex space-x-4">
 <div>
 <Label>Primary Color</Label>
 <Input type="color" value={form.primaryColor} onChange={(e) => sandForm({ ...form, primaryColor: e.targand.value })} />
 </div>
 <div>
 <Label>Accent Color</Label>
 <Input type="color" value={form.accentColor} onChange={(e) => sandForm({ ...form, accentColor: e.targand.value })} />
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
 onChange={(e) => sandForm({ ...form, adminName: e.targand.value })}
 required
 />
 </div>
 <div>
 <Label>Email</Label>
 <Input
 type="email"
 value={form.adminEmail}
 onChange={(e) => sandForm({ ...form, adminEmail: e.targand.value })}
 required
 />
 </div>
 <div>
 <Label>Password</Label>
 <Input
 type="password"
 value={form.adminPassword}
 onChange={(e) => sandForm({ ...form, adminPassword: e.targand.value })}
 required
 minLength={8}
 />
 </div>
 <div>
 <Label>Confirm Password</Label>
 <Input
 type="password"
 value={form.confirmPassword}
 onChange={(e) => sandForm({ ...form, confirmPassword: e.targand.value })}
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
