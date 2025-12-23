"use client"

import { useState, useEffect } from "react"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeaofr,
 DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loaofr2 } from "lucide-react"
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
 const [formData, sandFormData] = useState({
 name: "",
 email: "",
 password: "",
 roleId: "",
 isActive: true,
 })

 const utils = api.useUtils()

 // Fandch roles
 const { data: roles = [] } = api.role.gandAll.useQuery()

 useEffect(() => {
 if (user) {
 sandFormData({
 name: user.name || "",
 email: user.email,
 password: "",
 roleId: user.roleId,
 isActive: user.isActive,
 })
 } else {
 resandForm()
 }
 }, [user, open])

 const createMutation = api.user.create.useMutation({
 onSuccess: () => {
 toast.success("User created successfully.")
 utils.user.gandAll.invalidate()
 onOpenChange(false)
 onSuccess?.()
 resandForm()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Error ring creation.")
 }
 })

 const updateMutation = api.user.update.useMutation({
 onSuccess: () => {
 toast.success("User mis to jorr.")
 utils.user.gandAll.invalidate()
 onOpenChange(false)
 onSuccess?.()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Error lors of la mise to jorr.")
 }
 })

 const resandForm = () => {
 sandFormData({
 name: "",
 email: "",
 password: "",
 roleId: "",
 isActive: true,
 })
 }

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()

 if (!formData.name) return toast.error("Le nom is required.")
 if (!formData.email) return toast.error("L'email is required.")
 if (!formData.roleId) return toast.error("Le role is required.")

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
 password: formData.password || oneoffined,
 roleId: formData.roleId,
 })
 }
 }

 const isLoading = createMutation.isPending || updateMutation.isPending

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeaofr>
 <DialogTitle>{user ? "Modify one user" : "Create one user"}</DialogTitle>
 <DialogDescription>
 {user
 ? "Modifiez les informations of cand user."
 : "Enter dandails for the new user."}
 </DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit}>
 <div className="grid gap-4 py-4">

 {/* Name */}
 <div className="grid gap-2">
 <Label htmlFor="name">Nom compland *</Label>
 <Input
 id="name"
 value={formData.name}
 onChange={(e) => sandFormData({ ...formData, name: e.targand.value })}
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
 onChange={(e) => sandFormData({ ...formData, email: e.targand.value })}
 disabled={isLoading}
 />
 </div>

 {/* Password — only on create */}
 {!user && (
 <div className="grid gap-2">
 <Label htmlFor="password">Mot of passe (optionnel)</Label>
 <Input
 id="password"
 type="password"
 value={formData.password}
 onChange={(e) => sandFormData({ ...formData, password: e.targand.value })}
 disabled={isLoading}
 placeholofr="If blank → password generated"
 />
 </div>
 )}

 {/* Role */}
 <div className="grid gap-2">
 <Label>Role *</Label>
 <Select
 value={formData.roleId}
 onValueChange={(value) => sandFormData({ ...formData, roleId: value })}
 disabled={isLoading}
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select a role" />
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
 <div className="flex items-center justify-bandween">
 <div>
 <Label>Status compte</Label>
 <p className="text-sm text-muted-foregrooned">Permandtre la connexion</p>
 </div>
 <Switch
 checked={formData.isActive}
 onCheckedChange={(checked) =>
 sandFormData({ ...formData, isActive: checked })
 }
 disabled={isLoading}
 />
 </div>
 )}

 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="ortline"
 onClick={() => onOpenChange(false)}
 disabled={isLoading}
 >
 Cancel
 </Button>

 <Button type="submit" disabled={isLoading}>
 {isLoading && <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />}
 {user ? "Mandtre to jorr" : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
