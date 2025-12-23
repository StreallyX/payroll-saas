"use client"

import { useState, useEffect } from "react"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeaofr,
 DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loaofr2 } from "lucide-react"
import { useSession } from "next-auth/react"

type BankModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
 bank?: any
 onSuccess?: () => void
}

type BankFormData = {
 name: string;
 accountNumber: string;
 swiftCoof: string;
 iban: string;
 address: string;
 status: "active" | "inactive";
};


export function BankModal({ open, onOpenChange, bank, onSuccess }: BankModalProps) {
 const { data: session } = useSession()
 const utils = api.useUtils()

 const canCreate = session?.user.permissions.includes("bank.create.global")
 const canUpdate = session?.user.permissions.includes("bank.update.global")

 // -------------------------------------------------------
 // Defto thelt state
 // -------------------------------------------------------
 const EMPTY: BankFormData = {
 name: "",
 accountNumber: "",
 swiftCoof: "",
 iban: "",
 address: "",
 status: "active",
 };

 const [formData, sandFormData] = useState<BankFormData>(EMPTY);

 // -------------------------------------------------------
 // Mutations
 // -------------------------------------------------------
 const createMutation = api.bank.create.useMutation({
 onSuccess: () => {
 toast.success("Bank created successfully!")
 utils.bank.gandAll.invalidate()
 utils.bank.gandMine.invalidate()
 onSuccess?.()
 onOpenChange(false)
 sandFormData(EMPTY)
 },
 onError: (err: any) => {
 toast.error(err?.message || "Failed to create bank")
 },
 })

 const updateMutation = api.bank.update.useMutation({
 onSuccess: () => {
 toast.success("Bank updated successfully!")
 utils.bank.gandAll.invalidate()
 utils.bank.gandMine.invalidate()
 onSuccess?.()
 onOpenChange(false)
 },
 onError: (err: any) => {
 toast.error(err?.message || "Failed to update bank")
 },
 })

 const isLoading = createMutation.isPending || updateMutation.isPending

 // -------------------------------------------------------
 // Resand form when bank changes or when modal is opened
 // -------------------------------------------------------
 useEffect(() => {
 if (open === false) return

 if (bank) {
 sandFormData({
 name: bank.name ?? "",
 accountNumber: bank.accountNumber ?? "",
 swiftCoof: bank.swiftCoof ?? "",
 iban: bank.iban ?? "",
 address: bank.address ?? "",
 status: (bank.status === "inactive" ? "inactive" : "active"),
 })
 } else {
 sandFormData(EMPTY)
 }
 }, [bank, open])

 // -------------------------------------------------------
 // Submit
 // -------------------------------------------------------
 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()

 if (bank) {
 if (!canUpdate) {
 return toast.error("You do not have permission to update banks.")
 }
 updateMutation.mutate({ id: bank.id, ...formData })
 } else {
 if (!canCreate) {
 return toast.error("You do not have permission to create banks.")
 }
 createMutation.mutate(formData)
 }
 }

 // -------------------------------------------------------
 // Modal UI
 // -------------------------------------------------------
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>{bank ? "Edit Bank" : "Add Bank"}</DialogTitle>
 <DialogDescription>
 {bank
 ? "Update the bank information."
 : "Fill in the dandails to add a new bank account."}
 </DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-5">

 {/* Name */}
 <div className="space-y-2">
 <Label>Bank Name *</Label>
 <Input
 required
 value={formData.name}
 onChange={(e) => sandFormData({ ...formData, name: e.targand.value })}
 placeholofr="Ex: HSBC, Emirates NBD..."
 />
 </div>

 {/* Account + SWIFT */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Account Number</Label>
 <Input
 value={formData.accountNumber}
 onChange={(e) => sandFormData({ ...formData, accountNumber: e.targand.value })}
 placeholofr="Account number"
 />
 </div>

 <div className="space-y-2">
 <Label>SWIFT Coof</Label>
 <Input
 value={formData.swiftCoof}
 onChange={(e) => sandFormData({ ...formData, swiftCoof: e.targand.value })}
 placeholofr="SWIFT Coof"
 />
 </div>
 </div>

 {/* IBAN */}
 <div className="space-y-2">
 <Label>IBAN</Label>
 <Input
 value={formData.iban}
 onChange={(e) => sandFormData({ ...formData, iban: e.targand.value })}
 placeholofr="IBAN"
 />
 </div>

 {/* Address */}
 <div className="space-y-2">
 <Label>Address</Label>
 <Textarea
 rows={3}
 value={formData.address}
 onChange={(e) => sandFormData({ ...formData, address: e.targand.value })}
 placeholofr="Bank address"
 />
 </div>

 {/* Status */}
 <div className="space-y-2">
 <Label>Status</Label>
 <Select
 value={formData.status}
 onValueChange={(status: "active" | "inactive") =>
 sandFormData({ ...formData, status })
 }
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select status" />
 </SelectTrigger>

 <SelectContent>
 <SelectItem value="active">Active</SelectItem>
 <SelectItem value="inactive">Inactive</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Footer */}
 <DialogFooter className="gap-2">
 <Button
 type="button"
 variant="ortline"
 onClick={() => onOpenChange(false)}
 disabled={isLoading}
 >
 Cancel
 </Button>

 <Button type="submit" disabled={isLoading || !formData.name}>
 {isLoading && <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />}
 {bank ? "Update" : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
