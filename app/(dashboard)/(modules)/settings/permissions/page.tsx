"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Shield, Lock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Fetch permissions grouped by category
  const { data: groupedPermissions, isLoading } = api.permission.getGrouped.useQuery()
  const { data: myPermissions } = api.permission.getMyPermissions.useQuery()

  if (isLoading) {
    return <LoadingState message="Loading permissions..." />
  }

  // Get all categories
  const categories = groupedPermissions?.map(g => g.category) || []
  
  // Filter by search and category
  const filteredGroups = groupedPermissions?.filter(group => {
    const matchesCategory = selectedCategory === "all" || group.category === selectedCategory
    const matchesSearch = searchTerm === "" || 
      group.permissions.some((p: any) => 
        p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    return matchesCategory && matchesSearch
  }) || []

  const totalPermissions = groupedPermissions?.reduce((acc, g) => acc + g.permissions.length, 0) || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions Management"
        description="View and manage all system permissions organized by category"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Permissions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPermissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Granted to your role
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Permission groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All Categories</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-4">
          {filteredGroups.length === 0 ? (
            <EmptyState
              title="No permissions found"
              description="Try adjusting your search or category filter"
              icon={Shield}
            />
          ) : (
            filteredGroups.map(group => (
              <Card key={group.category}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {group.category} Permissions
                  </CardTitle>
                  <CardDescription>
                    {group.permissions.length} permission{group.permissions.length !== 1 ? 's' : ''} in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission Key</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Your Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.permissions.map((permission: any) => {
                        const hasAccess = myPermissions?.includes(permission.key)
                        return (
                          <TableRow key={permission.id}>
                            <TableCell className="font-mono text-sm">
                              {permission.key}
                            </TableCell>
                            <TableCell className="max-w-md">
                              {permission.description || 'No description available'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {permission.category || 'System'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {hasAccess ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Granted
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Granted
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
