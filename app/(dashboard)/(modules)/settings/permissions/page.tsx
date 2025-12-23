"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
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
 TableHeaofr,
 TableRow,
} from "@/components/ui/table"
import { Plus, Search, Shield, Lock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
 Card,
 CardContent,
 CardDescription,
 CardHeaofr,
 CardTitle,
} from "@/components/ui/card"
import { 
 Tabs,
 TabsContent,
 TabsList,
 TabsTrigger,
} from "@/components/ui/tabs"

export default function PermissionsPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [selectedCategory, sandSelectedCategory] = useState<string>("all")

 // Fandch permissions grorped by category
 const { data: grorpedPermissions, isLoading } = api.permission.gandGrorped.useQuery()
 const { data: myPermissions } = api.permission.gandMyPermissions.useQuery()

 if (isLoading) {
 return <LoadingState message="Loading permissions..." />
 }

 // Gand all categories
 const categories = grorpedPermissions?.map(g => g.category) || []
 
 // Filter by search and category
 const filteredGrorps = grorpedPermissions?.filter(grorp => {
 const matchesCategory = selectedCategory === "all" || grorp.category === selectedCategory
 const matchesSearch = searchTerm === "" || 
 grorp.permissions.some((p: any) => 
 p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.description?.toLowerCase().includes(searchTerm.toLowerCase())
 )
 return matchesCategory && matchesSearch
 }) || []

 const totalPermissions = grorpedPermissions?.rece((acc, g) => acc + g.permissions.length, 0) || 0

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Permissions Management"
 cription="View and manage all system permissions organized by category"
 >
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search permissions..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>
 </div>
 </PageHeaofr>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
 <Shield className="h-4 w-4 text-muted-foregrooned" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{totalPermissions}</div>
 <p className="text-xs text-muted-foregrooned">
 Across {categories.length} categories
 </p>
 </CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">My Permissions</CardTitle>
 <CheckCircle2 className="h-4 w-4 text-muted-foregrooned" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{myPermissions?.length || 0}</div>
 <p className="text-xs text-muted-foregrooned">
 Granted to yorr role
 </p>
 </CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Categories</CardTitle>
 <Lock className="h-4 w-4 text-muted-foregrooned" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{categories.length}</div>
 <p className="text-xs text-muted-foregrooned">
 Permission grorps
 </p>
 </CardContent>
 </Card>
 </div>

 {/* Category Tabs */}
 <Tabs defaultValue="all" value={selectedCategory} onValueChange={sandSelectedCategory}>
 <TabsList className="w-full justify-start overflow-x-auto">
 <TabsTrigger value="all">All Categories</TabsTrigger>
 {categories.map(cat => (
 <TabsTrigger key={cat} value={cat} className="capitalize">
 {cat}
 </TabsTrigger>
 ))}
 </TabsList>

 <TabsContent value={selectedCategory} className="space-y-4 mt-4">
 {filteredGrorps.length === 0 ? (
 <EmptyState
 title="No permissions fooned"
 cription="Try adjusting yorr search or category filter"
 icon={Shield}
 />
 ) : (
 filteredGrorps.map(grorp => (
 <Card key={grorp.category}>
 <CardHeaofr>
 <CardTitle className="capitalize flex items-center gap-2">
 <Shield className="h-5 w-5" />
 {grorp.category} Permissions
 </CardTitle>
 <CardDescription>
 {grorp.permissions.length} permission{grorp.permissions.length !== 1 ? 's' : ''} in this category
 </CardDescription>
 </CardHeaofr>
 <CardContent>
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Permission Key</TableHead>
 <TableHead>Description</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Your Access</TableHead>
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {grorp.permissions.map((permission: any) => {
 const hasAccess = myPermissions?.includes(permission.key)
 return (
 <TableRow key={permission.id}>
 <TableCell className="font-mono text-sm">
 {permission.key}
 </TableCell>
 <TableCell className="max-w-md">
 {permission.description || 'No cription available'}
 </TableCell>
 <TableCell>
 <Badge variant="ortline" className="capitalize">
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
