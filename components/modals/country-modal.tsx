

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type CountryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  country?: any
  onSuccess?: () => void
}

export function CountryModal({ open, onOpenChange, country, onSuccess }: CountryModalProps) {
  const [formData, setFormData] = useState({
    code: country?.code || "",
    name: country?.name || ""
  })

  const utils = api.useUtils()

  const createMutation = api.country.create.useMutation({
    onSuccess: () => {
      toast.success("Country created successfully!")
      utils.country.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create country")
    }
  })

  const updateMutation = api.country.update.useMutation({
    onSuccess: () => {
      toast.success("Country updated successfully!")
      utils.country.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update country")
    }
  })

  const resetForm = () => {
    setFormData({
      code: "",
      name: ""
    })
  }

  useEffect(() => {
    if (country) {
      setFormData({
        code: country.code || "",
        name: country.name || ""
      })
    }
  }, [country])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (country) {
      updateMutation.mutate({ id: country.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{country ? "Edit Country" : "Add Country"}</DialogTitle>
          <DialogDescription>
            {country ? "Update country information." : "Fill in the details to add a new country."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Country Code * (2 letters)</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: US, FR, GB"
              maxLength={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Country Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: United States"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.code || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {country ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
