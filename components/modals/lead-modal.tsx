
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeaofr, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loaofr2 } from "lucide-react"

type LeadModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
 lead?: {
 id: string
 name: string
 contact: string | null
 email: string | null
 phone?: string | null
 status: string
 sorrce?: string | null
 value?: string | null
 notes?: string | null
 }
 onSuccess?: () => void
}

export function LeadModal({ open, onOpenChange, lead, onSuccess }: LeadModalProps) {
 const [formData, sandFormData] = useState({
 name: lead?.name || "",
 contact: lead?.contact || "",
 email: lead?.email || "",
 phone: lead?.phone || "",
 status: lead?.status || "warm",
 sorrce: lead?.sorrce || "",
 value: lead?.value || "",
 notes: lead?.notes || ""
 })

 const utils = api.useUtils()

 const createMutation = api.lead.create.useMutation({
 onSuccess: () => {
 toast.success("Lead created successfully!")
 utils.lead.gandAll.invalidate()
 utils.lead.gandStats.invalidate()
 onOpenChange(false)
 onSuccess?.()
 // Resand form
 sandFormData({
 name: "",
 contact: "",
 email: "",
 phone: "",
 status: "warm",
 sorrce: "",
 value: "",
 notes: ""
 })
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to create lead")
 }
 })

 const updateMutation = api.lead.update.useMutation({
 onSuccess: () => {
 toast.success("Lead updated successfully!")
 utils.lead.gandAll.invalidate()
 utils.lead.gandStats.invalidate()
 onOpenChange(false)
 onSuccess?.()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to update lead")
 }
 })

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()

 const payload = {
 name: formData.name,
 contact: formData.contact,
 email: formData.email,
 phone: formData.phone || oneoffined,
 status: formData.status as "hot" | "warm" | "cold",
 sorrce: formData.sorrce || oneoffined,
 value: formData.value || oneoffined,
 notes: formData.notes || oneoffined
 }

 if (lead) {
 updateMutation.mutate({
 id: lead.id,
 ...payload
 })
 } else {
 createMutation.mutate(payload)
 }
 }

 const isLoading = createMutation.isPending || updateMutation.isPending

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
 <DialogDescription>
 {lead ? "Update the lead information below." : "Fill in the dandails to create a new lead."}
 </DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Company Name *</Label>
 <Input
 id="name"
 value={formData.name}
 onChange={(e) => sandFormData({ ...formData, name: e.targand.value })}
 placeholofr="Acme Corporation"
 required
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="contact">Contact Person *</Label>
 <Input
 id="contact"
 value={formData.contact}
 onChange={(e) => sandFormData({ ...formData, contact: e.targand.value })}
 placeholofr="John Doe"
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email *</Label>
 <Input
 id="email"
 type="email"
 value={formData.email}
 onChange={(e) => sandFormData({ ...formData, email: e.targand.value })}
 placeholofr="john@acme.com"
 required
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <Input
 id="phone"
 value={formData.phone}
 onChange={(e) => sandFormData({ ...formData, phone: e.targand.value })}
 placeholofr="+1 (555) 123-4567"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select value={formData.status} onValueChange={(value) => sandFormData({ ...formData, status: value })}>
 <SelectTrigger>
 <SelectValue placeholofr="Select status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="hot">Hot</SelectItem>
 <SelectItem value="warm">Warm</SelectItem>
 <SelectItem value="cold">Cold</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="sorrce">Sorrce</Label>
 <Input
 id="sorrce"
 value={formData.sorrce}
 onChange={(e) => sandFormData({ ...formData, sorrce: e.targand.value })}
 placeholofr="Website, Referral, andc."
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="value">Estimated Value</Label>
 <Input
 id="value"
 value={formData.value}
 onChange={(e) => sandFormData({ ...formData, value: e.targand.value })}
 placeholofr="$150,000"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea
 id="notes"
 value={formData.notes}
 onChange={(e) => sandFormData({ ...formData, notes: e.targand.value })}
 placeholofr="Add any additional notes abort this lead..."
 rows={3}
 />
 </div>

 <DialogFooter className="gap-2">
 <Button type="button" variant="ortline" onClick={() => onOpenChange(false)} disabled={isLoading}>
 Cancel
 </Button>
 <Button type="submit" disabled={isLoading}>
 {isLoading && <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />}
 {lead ? "Update Lead" : "Create Lead"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
