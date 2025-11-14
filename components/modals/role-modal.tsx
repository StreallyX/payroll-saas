

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2, Shield, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type RoleModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: any
  onSuccess?: () => void
}

export function RoleModal({ open, onOpenChange, role, onSuccess }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    homePath: "/admin",
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")

  const utils = api.useUtils()

  // Fetch all permissions
  const { data: allPermissions = [] } = api.permission.getAll.useQuery()
  
  // Fetch grouped permissions
  const { data: groupedPermissions = [] } = api.permission.getGrouped.useQuery()

  // Fetch role details if editing
  const { data: roleDetails } = api.role.getById.useQuery(
    { id: role?.id },
    { enabled: !!role?.id && open }
  )

  useEffect(() => {
    if (roleDetails) {
      setFormData({
        name: roleDetails.name || "",
        homePath: roleDetails.homePath || "/admin",
      })
      
      // Set selected permissions
      const permissionIds = roleDetails.rolePermissions?.map((rp: any) => rp.permission.id) || []
      setSelectedPermissions(permissionIds)
    } else if (!role) {
      resetForm()
    }
  }, [roleDetails, role, open])

  const createMutation = api.role.create.useMutation({
    onSuccess: async (newRole) => {
      if (selectedPermissions.length > 0) {
        // Assign permissions to the new role
        await assignPermissionsMutation.mutateAsync({
          roleId: newRole.id,
          permissionIds: selectedPermissions
        })
      }
      
      toast.success("Role created successfully!")
      utils.role.getAll.invalidate()
      utils.role.getStats.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create role")
    }
  })

  const updateMutation = api.role.update.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully!")
      utils.role.getAll.invalidate()
      utils.role.getStats.invalidate()
      utils.role.getById.invalidate({ id: role?.id })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update role")
    }
  })

  const assignPermissionsMutation = api.role.assignPermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissions updated successfully!")
      utils.role.getAll.invalidate()
      utils.role.getById.invalidate({ id: role?.id })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update permissions")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      homePath: "/admin",
    })
    setSelectedPermissions([])
    setActiveTab("basic")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name) {
      toast.error("Role name is required")
      return
    }

    if (role) {
      // Update existing role
      await updateMutation.mutateAsync({
        id: role.id,
        name: formData.name,
        homePath: formData.homePath,
      })
      
      // Update permissions
      if (selectedPermissions.length > 0 || (roleDetails?.rolePermissions?.length ?? 0) > 0) {
        await assignPermissionsMutation.mutateAsync({
          roleId: role.id,
          permissionIds: selectedPermissions
        })
      }
    } else {
      // Create new role
      createMutation.mutate({
        name: formData.name,
        homePath: formData.homePath,
        permissionIds: selectedPermissions,
      })
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSelectAll = (categoryPermissions: any[]) => {
    const categoryIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryIds.every(id => selectedPermissions.includes(id))
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryIds.includes(id)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryIds])])
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || assignPermissionsMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {role ? "Edit Role" : "New Role"}
          </DialogTitle>
          <DialogDescription>
            {role
              ? "Modify role information and permissions"
              : "Create a new role to organize user permissions"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="permissions">
              Permissions 
              {selectedPermissions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedPermissions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Role Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Manager, Supervisor"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Role name must be unique in your organization
                </p>
              </div>

              {/* Home Path */}
              <div className="grid gap-2">
                <Label htmlFor="homePath">
                  Home Path <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="homePath"
                  value={formData.homePath}
                  onChange={(e) => setFormData({ ...formData, homePath: e.target.value })}
                  placeholder="/admin"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Default landing page for users with this role
                </p>
              </div>

              {role && roleDetails && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Role Information</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Users: {roleDetails._count?.users || 0}</div>
                    <div>Permissions: {roleDetails.rolePermissions?.length || 0}</div>
                    <div>Created: {new Date(roleDetails.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {groupedPermissions.map((group: any) => (
                    <div key={group.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          {group.category}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAll(group.permissions)}
                        >
                          {group.permissions.every((p: any) => selectedPermissions.includes(p.id))
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.permissions.map((permission: any) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              disabled={isLoading}
                            />
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.key}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <DialogFooter className="mt-6">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
