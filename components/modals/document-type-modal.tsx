

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type DocumentTypeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType?: {
    id: string
    name: string
    description?: string | null
    isRequired: boolean
    isActive: boolean
  }
  onSuccess?: () => void
}

export function DocumentTypeModal({ open, onOpenChange, documentType, onSuccess }: DocumentTypeModalProps) {
  const [formData, setFormData] = useState({
    name: documentType?.name || "",
    description: documentType?.description || "",
    isRequired: documentType?.isRequired ?? false,
    isActive: documentType?.isActive ?? true,
  })

  const utils = api.useUtils()

  useEffect(() => {
    if (documentType) {
      setFormData({
        name: documentType.name || "",
        description: documentType.description || "",
        isRequired: documentType.isRequired ?? false,
        isActive: documentType.isActive ?? true,
      })
    } else {
      resetForm()
    }
  }, [documentType, open])

  const createMutation = api.documentType.create.useMutation({
    onSuccess: () => {
      toast.success("Type de document created successfully!")
      utils.documentType.getAll.invalidate()
      utils.documentType.getStats.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create du type de document")
    }
  })

  const updateMutation = api.documentType.update.useMutation({
    onSuccess: () => {
      toast.success("Type de document updated successfully!")
      utils.documentType.getAll.invalidate()
      utils.documentType.getStats.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update du type de document")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isRequired: false,
      isActive: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name) {
      toast.error("Le nom du type de document est requis")
      return
    }

    if (documentType) {
      // Update existing document type
      updateMutation.mutate({
        id: documentType.id,
        name: formData.name,
        description: formData.description || undefined,
        isRequired: formData.isRequired,
        isActive: formData.isActive,
      })
    } else {
      // Create new document type
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        isRequired: formData.isRequired,
        isActive: formData.isActive,
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {documentType ? "Edit type de document" : "New type de document"}
          </DialogTitle>
          <DialogDescription>
            {documentType
              ? "Modifiez les informations du type de document"
              : "Créez un nouveau type de document pour le système d'onboarding"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nom du type de document <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Passeport, Permis de travail"
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du type de document..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Is Required */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isRequired">Document obligatoire</Label>
                <p className="text-sm text-muted-foreground">
                  Ce document doit être fourni lors de l'onboarding
                </p>
              </div>
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRequired: checked })
                }
                disabled={isLoading}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Le type de document est disponible dans le système
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={isLoading}
              />
            </div>
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
              {documentType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
