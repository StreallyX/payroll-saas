"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { api } from "@/lib/trpc"
import { Search, Shield, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Group permissions by resource
function groupByResource(permissions: any[]) {
  const groups: Record<string, { resource: string; permissions: any[] }> = {}

  for (const perm of permissions) {
    const resource = perm.resource || perm.key.split('.')[0]
    if (!groups[resource]) {
      groups[resource] = { resource, permissions: [] }
    }
    groups[resource].permissions.push(perm)
  }

  return Object.values(groups).sort((a, b) => a.resource.localeCompare(b.resource))
}

// Format resource name for display
function formatResourceName(resource: string): string {
  return resource
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Get action from permission key
function getAction(key: string): string {
  const parts = key.split('.')
  return parts[1] || 'unknown'
}

// Get scope from permission key
function getScope(key: string): string {
  const parts = key.split('.')
  return parts[2] || 'global'
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

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())

  const { data: allPermissions = [], isLoading } = api.permission.getAll.useQuery()
  const { data: myPermissions = [] } = api.permission.getMyPermissions.useQuery()

  const myPermissionSet = useMemo(() => new Set(myPermissions), [myPermissions])

  const groupedByResource = useMemo(() => {
    return groupByResource(allPermissions)
  }, [allPermissions])

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedByResource

    const search = searchTerm.toLowerCase()
    return groupedByResource
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(p =>
          p.key.toLowerCase().includes(search) ||
          p.displayName?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          group.resource.toLowerCase().includes(search)
        )
      }))
      .filter(group => group.permissions.length > 0)
  }, [groupedByResource, searchTerm])

  const toggleResource = (resource: string) => {
    setExpandedResources(prev => {
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
    setExpandedResources(new Set(groupedByResource.map(g => g.resource)))
  }

  const collapseAll = () => {
    setExpandedResources(new Set())
  }

  if (isLoading) {
    return <LoadingState message="Loading permissions..." />
  }

  const totalPermissions = allPermissions.length
  const myPermissionCount = myPermissions.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="View all system permissions organized by resource"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{totalPermissions} permissions</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{myPermissionCount} granted to you</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
          <span className="text-sm font-medium">{groupedByResource.length} resources</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:underline"
          >
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Legend</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Scopes:</span>
              {Object.entries(scopeColors).map(([scope, color]) => (
                <Badge key={scope} className={cn("text-xs", color)}>
                  {scope}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Actions:</span>
              {['read', 'create', 'update', 'delete', 'approve'].map(action => (
                <Badge key={action} className={cn("text-xs", actionColors[action] || "bg-gray-100")}>
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Resource */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No permissions found matching your search.
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map(group => {
            const isExpanded = expandedResources.has(group.resource)
            const grantedCount = group.permissions.filter(p => myPermissionSet.has(p.key)).length

            return (
              <Collapsible
                key={group.resource}
                open={isExpanded}
                onOpenChange={() => toggleResource(group.resource)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <Shield className="h-5 w-5 text-blue-500" />
                          <CardTitle className="text-base">
                            {formatResourceName(group.resource)}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-normal">
                            {group.permissions.length} permissions
                          </Badge>
                          {grantedCount > 0 && (
                            <Badge className="bg-green-100 text-green-800 font-normal">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {grantedCount} granted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.permissions.map(permission => {
                          const hasAccess = myPermissionSet.has(permission.key)
                          const action = getAction(permission.key)
                          const scope = getScope(permission.key)

                          return (
                            <div
                              key={permission.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-sm",
                                hasAccess
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              )}
                            >
                              {hasAccess ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {permission.displayName || action}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge className={cn("text-[10px] px-1.5 py-0", actionColors[action] || "bg-gray-100")}>
                                  {action}
                                </Badge>
                                <Badge className={cn("text-[10px] px-1.5 py-0", scopeColors[scope] || "bg-gray-100")}>
                                  {scope}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })
        )}
      </div>
    </div>
  )
}
