"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import {
  Loader2,
  Shield,
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type RoleModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: any
  onSuccess?: () => void
}

// Group permissions by resource
function groupByResource(permissions: any[]) {
  const groups: Record<string, { resource: string; permissions: any[] }> = {}

  for (const perm of permissions) {
    const resource = perm.resource || perm.key.split(".")[0]
    if (!groups[resource]) {
      groups[resource] = { resource, permissions: [] }
    }
    groups[resource].permissions.push(perm)
  }

  return Object.values(groups).sort((a, b) =>
    a.resource.localeCompare(b.resource)
  )
}

// Format resource name for display
function formatResourceName(resource: string): string {
  return resource.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

// Get action from permission key
function getAction(key: string): string {
  const parts = key.split(".")
  return parts[1] || "unknown"
}

// Get scope from permission key
function getScope(key: string): string {
  const parts = key.split(".")
  return parts[2] || "global"
}

// Scope badge colors
const scopeColors: Record<string, string> = {
  global: "bg-blue-100 text-blue-800",
  own: "bg-green-100 text-green-800",
  tenant: "bg-purple-100 text-purple-800",
  page: "bg-orange-100 text-orange-800",
}

// Action badge colors
const actionColors: Record<string, string> = {
  read: "bg-emerald-100 text-emerald-800",
  list: "bg-emerald-100 text-emerald-800",
  create: "bg-blue-100 text-blue-800",
  update: "bg-amber-100 text-amber-800",
  delete: "bg-red-100 text-red-800",
  access: "bg-gray-100 text-gray-800",
  approve: "bg-indigo-100 text-indigo-800",
  reject: "bg-rose-100 text-rose-800",
}

export function RoleModal({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    homePath: "/admin",
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  )
  const [activeTab, setActiveTab] = useState("basic")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set()
  )

  const utils = api.useUtils()

  // Fetch all permissions
  const { data: allPermissions = [] } = api.permission.getAll.useQuery()

  // Fetch role details if editing
  const { data: roleDetails, isLoading: isLoadingRole } =
    api.role.getById.useQuery({ id: role?.id }, { enabled: !!role?.id && open })

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    return groupByResource(allPermissions)
  }, [allPermissions])

  // Filter permissions by search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedPermissions

    const search = searchTerm.toLowerCase()
    return groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.key.toLowerCase().includes(search) ||
            p.displayName?.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search) ||
            group.resource.toLowerCase().includes(search)
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groupedPermissions, searchTerm])

  // Initialize form when role changes
  useEffect(() => {
    if (roleDetails && open) {
      setFormData({
        name: roleDetails.name || "",
        homePath: roleDetails.homePath || "/admin",
      })

      // Set selected permissions using IDs
      const permissionIds = new Set(
        roleDetails.rolePermissions?.map((rp: any) => rp.permission.id) || []
      )
      setSelectedPermissions(permissionIds)

      // Expand resources that have selected permissions
      const resourcesWithSelected = new Set<string>()
      for (const group of groupedPermissions) {
        if (group.permissions.some((p) => permissionIds.has(p.id))) {
          resourcesWithSelected.add(group.resource)
        }
      }
      setExpandedResources(resourcesWithSelected)
    } else if (!role && open) {
      resetForm()
    }
  }, [roleDetails, role, open, groupedPermissions])

  const createMutation = api.role.create.useMutation({
    onSuccess: async (newRole) => {
      if (selectedPermissions.size > 0) {
        await assignPermissionsMutation.mutateAsync({
          roleId: newRole.id,
          permissionIds: Array.from(selectedPermissions),
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
    },
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
    },
  })

  const assignPermissionsMutation = api.role.assignPermissions.useMutation({
    onSuccess: () => {
      utils.role.getAll.invalidate()
      utils.role.getById.invalidate({ id: role?.id })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update permissions")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      homePath: "/admin",
    })
    setSelectedPermissions(new Set())
    setActiveTab("basic")
    setSearchTerm("")
    setExpandedResources(new Set())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error("Role name is required")
      return
    }

    if (role) {
      await updateMutation.mutateAsync({
        id: role.id,
        name: formData.name,
        homePath: formData.homePath,
      })

      await assignPermissionsMutation.mutateAsync({
        roleId: role.id,
        permissionIds: Array.from(selectedPermissions),
      })
    } else {
      createMutation.mutate({
        name: formData.name,
        homePath: formData.homePath,
        permissionIds: Array.from(selectedPermissions),
      })
    }
  }

  const handlePermissionToggle = useCallback((permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }, [])

  const handleSelectAllInGroup = useCallback(
    (groupPermissions: any[]) => {
      const groupIds = groupPermissions.map((p) => p.id)

      setSelectedPermissions((prev) => {
        const next = new Set(prev)
        const allSelected = groupIds.every((id) => prev.has(id))
        if (allSelected) {
          groupIds.forEach((id) => next.delete(id))
        } else {
          groupIds.forEach((id) => next.add(id))
        }
        return next
      })
    },
    []
  )

  const toggleResource = (resource: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev)
      if (next.has(resource)) {
        next.delete(resource)
      } else {
        next.add(resource)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedResources(new Set(groupedPermissions.map((g) => g.resource)))
  }

  const collapseAll = () => {
    setExpandedResources(new Set())
  }

  const selectAll = () => {
    setSelectedPermissions(new Set(allPermissions.map((p) => p.id)))
  }

  const deselectAll = () => {
    setSelectedPermissions(new Set())
  }

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    assignPermissionsMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col overflow-hidden">
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              Permissions
              {selectedPermissions.size > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {selectedPermissions.size}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Role Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Manager, Supervisor"
                  disabled={isLoading}
                />
              </div>

              {/* Home Path */}
              <div className="grid gap-2">
                <Label htmlFor="homePath">Home Path</Label>
                <Input
                  id="homePath"
                  value={formData.homePath}
                  onChange={(e) =>
                    setFormData({ ...formData, homePath: e.target.value })
                  }
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
                    <div>
                      Permissions: {roleDetails.rolePermissions?.length || 0}
                    </div>
                    <div>
                      Created:{" "}
                      {new Date(roleDetails.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="permissions"
              className="flex-1 flex flex-col min-h-0 mt-4"
            >
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                  >
                    Expand All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                  >
                    Collapse All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="text-green-600"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="text-red-600"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">
                    {selectedPermissions.size}
                  </strong>{" "}
                  selected
                </span>
                <span>
                  <strong className="text-foreground">
                    {allPermissions.length}
                  </strong>{" "}
                  total
                </span>
                <span>
                  <strong className="text-foreground">
                    {groupedPermissions.length}
                  </strong>{" "}
                  resources
                </span>
              </div>

              {/* Permissions List */}
              <ScrollArea className="h-[calc(85vh-320px)] -mx-6 px-6">
                <div className="space-y-2 pb-4">
                  {filteredGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No permissions found matching your search.
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const isExpanded = expandedResources.has(group.resource)
                      const selectedInGroup = group.permissions.filter((p) =>
                        selectedPermissions.has(p.id)
                      ).length
                      const allSelectedInGroup =
                        selectedInGroup === group.permissions.length

                      return (
                        <Collapsible
                          key={group.resource}
                          open={isExpanded}
                          onOpenChange={() => toggleResource(group.resource)}
                        >
                          <div className="border rounded-lg">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">
                                    {formatResourceName(group.resource)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      selectedInGroup > 0 &&
                                        "bg-blue-50 border-blue-200"
                                    )}
                                  >
                                    {selectedInGroup}/{group.permissions.length}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSelectAllInGroup(group.permissions)
                                    }}
                                  >
                                    {allSelectedInGroup
                                      ? "Deselect All"
                                      : "Select All"}
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-t p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {group.permissions.map((permission) => {
                                  const isSelected = selectedPermissions.has(
                                    permission.id
                                  )
                                  const action = getAction(permission.key)
                                  const scope = getScope(permission.key)

                                  return (
                                    <label
                                      key={permission.id}
                                      htmlFor={`perm-${permission.id}`}
                                      className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                                        isSelected
                                          ? "bg-blue-50 border-blue-300 shadow-sm"
                                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                      )}
                                    >
                                      <Checkbox
                                        id={`perm-${permission.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          handlePermissionToggle(permission.id)
                                        }
                                        className={cn(
                                          isSelected &&
                                            "data-[state=checked]:bg-blue-600"
                                        )}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                          {permission.displayName || action}
                                        </div>
                                        {permission.description && (
                                          <div className="text-xs text-muted-foreground truncate">
                                            {permission.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                        <Badge
                                          className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            actionColors[action] ||
                                              "bg-gray-100"
                                          )}
                                        >
                                          {action}
                                        </Badge>
                                        <Badge
                                          className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            scopeColors[scope] || "bg-gray-100"
                                          )}
                                        >
                                          {scope}
                                        </Badge>
                                      </div>
                                    </label>
                                  )
                                })}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <DialogFooter className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
                {selectedPermissions.size > 0 && (
                  <Badge variant="secondary">
                    {selectedPermissions.size} permissions selected
                  </Badge>
                )}
              </div>
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
                {role ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
