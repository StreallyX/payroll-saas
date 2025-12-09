"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type UserModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    name?: string | null
    email: string
    roleId: string
    isActive: boolean
  }
  onSuccess?: () => void
}

export function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  })

  const utils = api.useUtils()

  // Fetch roles
  const { data: roles = [] } = api.role.getAll.useQuery()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email,
        password: "",
        roleId: user.roleId,
        isActive: user.isActive,
      })
    } else {
      resetForm()
    }
  }, [user, open])

  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur créé avec succès.")
      utils.user.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la création.")
    }
  })

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur mis à jour.")
      utils.user.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la mise à jour.")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      roleId: "",
      isActive: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) return toast.error("Le nom est requis.")
    if (!formData.email) return toast.error("L'email est requis.")
    if (!formData.roleId) return toast.error("Le rôle est requis.")

    if (user) {
      updateMutation.mutate({
        id: user.id,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        isActive: formData.isActive,
      })
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        roleId: formData.roleId,
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier un utilisateur" : "Créer un utilisateur"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Modifiez les informations de cet utilisateur."
              : "Indiquez les détails du nouvel utilisateur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Password — only on create */}
            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe (optionnel)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  placeholder="Si vide → mot de passe généré"
                />
              </div>
            )}

            {/* Role */}
            <div className="grid gap-2">
              <Label>Rôle *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status - Only for edit */}
            {user && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status du compte</Label>
                  <p className="text-sm text-muted-foreground">Permettre la connexion</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={isLoading}
                />
              </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
