"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
  swiftCode: string;
  iban: string;
  routingNumber: string;
  address: string;
  status: "active" | "inactive";
};


export function BankModal({ open, onOpenChange, bank, onSuccess }: BankModalProps) {
  const { data: session } = useSession()
  const utils = api.useUtils()

  const canCreate = session?.user.permissions.includes("bank.create.global")
  const canUpdate = session?.user.permissions.includes("bank.update.global")

  // -------------------------------------------------------
  // Default state
  // -------------------------------------------------------
  const EMPTY: BankFormData = {
    name: "",
    accountNumber: "",
    swiftCode: "",
    iban: "",
    routingNumber: "",
    address: "",
    status: "active",
  };

  const [formData, setFormData] = useState<BankFormData>(EMPTY);

  // -------------------------------------------------------
  // Mutations
  // -------------------------------------------------------
  const createMutation = api.bank.create.useMutation({
    onSuccess: () => {
      toast.success("Bank created successfully!")
      utils.bank.getAll.invalidate()
      utils.bank.getMine.invalidate()
      onSuccess?.()
      onOpenChange(false)
      setFormData(EMPTY)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create bank")
    },
  })

  const updateMutation = api.bank.update.useMutation({
    onSuccess: () => {
      toast.success("Bank updated successfully!")
      utils.bank.getAll.invalidate()
      utils.bank.getMine.invalidate()
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update bank")
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  // -------------------------------------------------------
  // Reset form when bank changes or when modal is opened
  // -------------------------------------------------------
  useEffect(() => {
    if (open === false) return

    if (bank) {
      setFormData({
        name: bank.name ?? "",
        accountNumber: bank.accountNumber ?? "",
        swiftCode: bank.swiftCode ?? "",
        iban: bank.iban ?? "",
        routingNumber: bank.routingNumber ?? "",
        address: bank.address ?? "",
        status: (bank.status === "inactive" ? "inactive" : "active"),
      })
    } else {
      setFormData(EMPTY)
    }
  }, [bank, open])

  // -------------------------------------------------------
  // Submit
  // -------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

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
        <DialogHeader>
          <DialogTitle>{bank ? "Edit Bank" : "Add Bank"}</DialogTitle>
          <DialogDescription>
            {bank
              ? "Update the bank information."
              : "Fill in the details to add a new bank account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="space-y-2">
            <Label>Bank Name *</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: HSBC, Emirates NBD..."
            />
          </div>

          {/* Account + SWIFT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Account number"
              />
            </div>

            <div className="space-y-2">
              <Label>SWIFT Code</Label>
              <Input
                value={formData.swiftCode}
                onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                placeholder="SWIFT Code"
              />
            </div>
          </div>

          {/* IBAN + Routing Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="IBAN"
              />
            </div>

            <div className="space-y-2">
              <Label>Routing Code</Label>
              <Input
                value={formData.routingNumber}
                onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                placeholder="ABA, Sort Code, BSB..."
              />
              <p className="text-xs text-muted-foreground">
                Optional - Required for some countries (US, UK, AU...)
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Bank address"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(status: "active" | "inactive") =>
                setFormData({ ...formData, status })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bank ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
