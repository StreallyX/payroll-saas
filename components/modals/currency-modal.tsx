

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type CurrencyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency?: any
  onSuccess?: () => void
}

export function CurrencyModal({ open, onOpenChange, currency, onSuccess }: CurrencyModalProps) {
  const [formData, setFormData] = useState({
    code: currency?.code || "",
    name: currency?.name || "",
    symbol: currency?.symbol || ""
  })

  const utils = api.useUtils()

  const createMutation = api.currency.create.useMutation({
    onSuccess: () => {
      toast.success("Currency created successfully!")
      utils.currency.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create currency")
    }
  })

  const updateMutation = api.currency.update.useMutation({
    onSuccess: () => {
      toast.success("Currency updated successfully!")
      utils.currency.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update currency")
    }
  })

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      symbol: ""
    })
  }

  useEffect(() => {
    if (currency) {
      setFormData({
        code: currency.code || "",
        name: currency.name || "",
        symbol: currency.symbol || ""
      })
    }
  }, [currency])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (currency) {
      updateMutation.mutate({ id: currency.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{currency ? "Edit Currency" : "Add Currency"}</DialogTitle>
          <DialogDescription>
            {currency ? "Update currency information." : "Fill in the details to add a new currency."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Currency Code * (3 letters)</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: USD, EUR, GBP"
              maxLength={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Currency Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: US Dollar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="Ex: $, €, £"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.code || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currency ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
