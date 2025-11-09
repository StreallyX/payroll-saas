

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type RoleModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: {
    id: string
    name: string
  }
  onSuccess?: () => void
}

export function RoleModal({ open, onOpenChange, role, onSuccess }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: role?.name || "",
  })

  const utils = api.useUtils()

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
      })
    } else {
      resetForm()
    }
  }, [role, open])

  const createMutation = api.role.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully!")
      utils.role.getAll.invalidate()
      utils.role.getStats.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create du rôle")
    }
  })

  const updateMutation = api.role.update.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully!")
      utils.role.getAll.invalidate()
      utils.role.getStats.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update du rôle")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name) {
      toast.error("Le nom du rôle est requis")
      return
    }

    if (role) {
      // Update existing role
      updateMutation.mutate({
        id: role.id,
        name: formData.name,
      })
    } else {
      // Create new role
      createMutation.mutate({
        name: formData.name,
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit rôle" : "New rôle"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Modifiez les informations du rôle"
              : "Créez un nouveau rôle pour organiser les permissions"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Role Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nom du rôle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Manager, Superviseur"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Le nom du rôle doit être unique dans votre organisation
              </p>
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
              {role ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
