

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type BankModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bank?: any
  onSuccess?: () => void
}

export function BankModal({ open, onOpenChange, bank, onSuccess }: BankModalProps) {
  const [formData, setFormData] = useState({
    name: bank?.name || "",
    accountNumber: bank?.accountNumber || "",
    swiftCode: bank?.swiftCode || "",
    iban: bank?.iban || "",
    address: bank?.address || "",
    status: bank?.status || "active"
  })

  const utils = api.useUtils()

  const createMutation = api.bank.create.useMutation({
    onSuccess: () => {
      toast.success("Bank created successfully!")
      utils.bank.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create bank")
    }
  })

  const updateMutation = api.bank.update.useMutation({
    onSuccess: () => {
      toast.success("Bank updated successfully!")
      utils.bank.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update bank")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      accountNumber: "",
      swiftCode: "",
      iban: "",
      address: "",
      status: "active"
    })
  }

  useEffect(() => {
    if (bank) {
      setFormData({
        name: bank.name || "",
        accountNumber: bank.accountNumber || "",
        swiftCode: bank.swiftCode || "",
        iban: bank.iban || "",
        address: bank.address || "",
        status: bank.status || "active"
      })
    }
  }, [bank])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (bank) {
      updateMutation.mutate({ id: bank.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bank ? "Edit Bank" : "Add Bank"}</DialogTitle>
          <DialogDescription>
            {bank ? "Update bank information." : "Fill in the details to add a new bank."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bank Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: HSBC Bank"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Account Number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT Code</Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode}
                onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                placeholder="SWIFT Code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="IBAN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Bank address..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
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
