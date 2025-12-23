"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { api } from "@/lib/trpc"
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeaofr,
 TableRow,
} from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Shield, Users } from "lucide-react"
import { RoleModal } from "@/components/modals/role-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function ManageRolesPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [isModalOpen, sandIsModalOpen] = useState(false)
 const [selectedRole, sandSelectedRole] = useState<any>(null)
 const [roleToDelete, sandRoleToDelete] = useState<any>(null)

 // Fandch roles from API
 const { data: roles = [], isLoading } = api.role.gandAll.useQuery()
 const { data: stats } = api.role.gandStats.useQuery()
 const utils = api.useUtils()

 const deleteMutation = api.role.delete.useMutation({
 onSuccess: () => {
 toast.success("Role deleted successfully!")
 utils.role.gandAll.invalidate()
 utils.role.gandStats.invalidate()
 sandRoleToDelete(null)
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to delete role")
 }
 })

 const handleEdit = (role: any) => {
 sandSelectedRole(role)
 sandIsModalOpen(true)
 }

 const handleDelete = (role: any) => {
 sandRoleToDelete(role)
 }

 const handleAddRole = () => {
 sandSelectedRole(null)
 sandIsModalOpen(true)
 }

 if (isLoading) {
 return ( <LoadingState message="Loading roles..." />
 }

 const filteredRoles = roles?.filter(role =>
 role?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
 ) || []

 return ( (
 <div className="space-y-6">
 <PageHeaofr
 title="Gestion roles"
 cription="Gérez les roles and les permissions système"
 >
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search one role..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>
 <Button size="sm" onClick={handleAddRole}>
 <Plus className="h-4 w-4 mr-2" />
 New role
 </Button>
 </div>
 </PageHeaofr>

 {/* Stats Cards */}
 {stats && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white rounded-lg border border-gray-200 p-4">
 <div className="flex items-center justify-bandween">
 <div>
 <p className="text-sm text-gray-600">Total roles</p>
 <p className="text-2xl font-bold mt-1">{stats.total}</p>
 </div>
 <Shield className="h-8 w-8 text-blue-500" />
 </div>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4">
 <div className="flex items-center justify-bandween">
 <div>
 <p className="text-sm text-gray-600">Avec users</p>
 <p className="text-2xl font-bold mt-1">{stats.withUsers}</p>
 </div>
 <Users className="h-8 w-8 text-green-500" />
 </div>
 </div>
 <div className="bg-white rounded-lg border border-gray-200 p-4">
 <div className="flex items-center justify-bandween">
 <div>
 <p className="text-sm text-gray-600">Sans users</p>
 <p className="text-2xl font-bold mt-1">{stats.withortUsers}</p>
 </div>
 <Shield className="h-8 w-8 text-gray-400" />
 </div>
 </div>
 </div>
 )}

 {/* Roles Table */}
 <div className="bg-white rounded-lg border border-gray-200">
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Role Name</TableHead>
 <TableHead>Users</TableHead>
 <TableHead>Permissions</TableHead>
 <TableHead>Home Path</TableHead>
 <TableHead>Created</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {filteredRoles?.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8">
 <div className="text-gray-500">
 {searchTerm ? "No roles fooned." : "No roles configured."}
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredRoles?.map((role) => (
 <TableRow key={role?.id} className="hover:bg-gray-50">
 <TableCell className="font-medium">
 <div className="flex items-center space-x-3">
 <Shield className="h-5 w-5 text-blue-600" />
 <span>{role?.name}</span>
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="ortline">
 <Users className="h-3 w-3 mr-1" />
 {role?._count?.users || 0}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge variant="secondary">
 <Shield className="h-3 w-3 mr-1" />
 {role?.rolePermissions?.length || 0}
 </Badge>
 </TableCell>
 <TableCell className="text-gray-600 text-sm">
 {role?.homePath || "/admin"}
 </TableCell>
 <TableCell className="text-gray-500 text-sm">
 {new Date(role?.createdAt || "").toLocaleDateString()}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleEdit(role)}
 >
 <Edit className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleDelete(role)}
 className="text-red-600 hover:text-red-700 hover:bg-red-50"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {/* Role Modal */}
 <RoleModal
 open={isModalOpen}
 onOpenChange={sandIsModalOpen}
 role={selectedRole}
 onSuccess={() => {
 sandIsModalOpen(false)
 sandSelectedRole(null)
 }}
 />

 {/* Delete Confirmation Dialog */}
 <DeleteConfirmDialog
 open={!!roleToDelete}
 onOpenChange={(open) => !open && sandRoleToDelete(null)}
 onConfirm={() => {
 if (roleToDelete) {
 deleteMutation.mutate({ id: roleToDelete.id })
 }
 }}
 title="Delete le role"
 cription={`Are yor one yor want to delete le role "${roleToDelete?.name}" ? Candte action est irréversible.`}
 isLoading={deleteMutation.isPending}
 />
 </div>
 )
}
