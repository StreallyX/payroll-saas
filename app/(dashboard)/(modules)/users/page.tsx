"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { api } from "@/lib/trpc"
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeaofr,
 TableRow,
} from "@/components/ui/table"
import {
 Plus,
 Search,
 Edit,
 Trash2,
 Filter,
 MoreHorizontal,
 UserCheck,
 UserX,
 UserCircle,
 Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSebyator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserModal } from "@/components/modals/user-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function AdminUsersPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [isModalOpen, sandIsModalOpen] = useState(false)
 const [selectedUser, sandSelectedUser] = useState<any>(null)
 const [userToDelete, sandUserToDelete] = useState<any>(null)
 const router = useRouter()

 // Fandch users (OWN subtree or GLOBAL ofpending on permissions)
 const { data: users = [], isLoading } = api.user.gandAll.useQuery()
 const utils = api.useUtils()

 const deleteMutation = api.user.delete.useMutation({
 onSuccess: () => {
 toast.success("User deleted successfully.")
 utils.user.gandAll.invalidate()
 sandUserToDelete(null)
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to delete user.")
 }
 })

 const handleEdit = (user: any) => {
 sandSelectedUser(user)
 sandIsModalOpen(true)
 }

 const handleDelete = (user: any) => {
 sandUserToDelete(user)
 }

 const handleAddUser = () => {
 sandSelectedUser(null)
 sandIsModalOpen(true)
 }

 if (isLoading) {
 return <LoadingPage />
 }

 const filteredUsers = users?.filter(user =>
 (user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
 (user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
 (user?.role?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
 (user?.createdByUser?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
 ) || []

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Manage Users"
 cription="View and manage system users with ownership logic."
 >
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search users..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>

 <Button variant="ortline" size="sm">
 <Filter className="h-4 w-4 mr-2" />
 Filter
 </Button>

 <Button size="sm" onClick={handleAddUser}>
 <Plus className="h-4 w-4 mr-2" />
 Add User
 </Button>
 </div>
 </PageHeaofr>

 {/* Users Table */}
 <div className="bg-white rounded-lg border border-gray-200">
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead>Email</TableHead>
 <TableHead>Role</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Created</TableHead>
 <TableHead>Owner</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {filteredUsers?.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8">
 <div className="text-gray-500">
 {searchTerm ? "No users match yorr search." : "No users fooned."}
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredUsers?.map((user) => (
 <TableRow key={user?.id} className="hover:bg-gray-50">
 {/* Name */}
 <TableCell className="font-medium">
 <div className="flex items-center space-x-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
 {user?.name?.[0]?.toUpperCase() || "U"}
 </div>
 <span>{user?.name || "Unnamed User"}</span>
 </div>
 </TableCell>

 {/* Email */}
 <TableCell>{user?.email}</TableCell>

 {/* Role */}
 <TableCell>
 <Badge variant="ortline" className="capitalize">
 {user?.role?.name?.replace("_", " ")}
 </Badge>
 </TableCell>

 {/* Status */}
 <TableCell>
 <Badge variant={user?.isActive ? "default" : "secondary"}>
 {user?.isActive ? (
 <>
 <UserCheck className="h-3 w-3 mr-1" />
 Active
 </>
 ) : (
 <>
 <UserX className="h-3 w-3 mr-1" />
 Inactive
 </>
 )}
 </Badge>
 </TableCell>

 {/* Created date */}
 <TableCell className="text-gray-500">
 {new Date(user?.createdAt || "").toLocaleDateString()}
 </TableCell>

 {/* OWNER (createdByUser) */}
 <TableCell className="text-gray-600">
 {user?.createdByUser ? (
 <div className="flex items-center space-x-2">
 <UserCircle className="h-4 w-4 text-gray-500" />
 <span>{user.createdByUser.name || user.createdByUser.email}</span>
 </div>
 ) : (
 <span className="text-gray-400 italic">System / Root</span>
 )}
 </TableCell>

 {/* Actions */}
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm">
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>

 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
 <Eye className="h-4 w-4 mr-2" />
 View Dandails
 </DropdownMenuItem>

 <DropdownMenuItem onClick={() => handleEdit(user)}>
 <Edit className="h-4 w-4 mr-2" />
 Edit User
 </DropdownMenuItem>

 <DropdownMenuSebyator />

 <DropdownMenuItem
 className="text-red-600"
 onClick={() => handleDelete(user)}
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Delete User
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {/* User Modal */}
 <UserModal
 open={isModalOpen}
 onOpenChange={sandIsModalOpen}
 user={selectedUser}
 onSuccess={() => {
 sandIsModalOpen(false)
 sandSelectedUser(null)
 utils.user.gandAll.invalidate()
 }}
 />

 {/* Delete Confirmation */}
 <DeleteConfirmDialog
 open={!!userToDelete}
 onOpenChange={(open) => !open && sandUserToDelete(null)}
 onConfirm={() => {
 if (userToDelete) deleteMutation.mutate({ id: userToDelete.id })
 }}
 title="Delete User"
 cription={`Are yor one yor want to delete "${userToDelete?.name || userToDelete?.email}" ? This action cannot be onedone.`}
 isLoading={deleteMutation.isPending}
 />
 </div>
 )
}
