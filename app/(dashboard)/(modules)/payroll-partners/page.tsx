"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
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
  TableHeader,
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
  Eye,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserModal } from "@/components/modals/user-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function PayrollPartnersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const router = useRouter()

  // Fetch payroll partner users
  const { data: users = [], isLoading } = api.user.getByRoleType.useQuery({
    roleType: "PAYROLL"
  })
  const utils = api.useUtils()

  const deleteMutation = api.user.delete.useMutation({
    onSuccess: () => {
      toast.success("Payroll partner deleted successfully.")
      utils.user.getByRoleType.invalidate()
      setUserToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete payroll partner.")
    }
  })

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = (user: any) => {
    setUserToDelete(user)
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return <LoadingPage />
  }

  const filteredUsers = users?.filter(user =>
    (user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.country?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Partners"
        description="Manage payroll partners and their accounts."
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search payroll partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>

          <Button size="sm" onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payroll Partner
          </Button>
        </div>
      </PageHeader>

      {/* Payroll Partners Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm ? "No payroll partners match your search." : "No payroll partners found."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user?.id} className="hover:bg-gray-50">
                  {/* Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-medium">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <span>{user?.name || "Unnamed Partner"}</span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell>{user?.email}</TableCell>

                  {/* Company */}
                  <TableCell>
                    {user?.companyName || <span className="text-gray-400">-</span>}
                  </TableCell>

                  {/* Country */}
                  <TableCell>
                    {user?.country?.name || <span className="text-gray-400">-</span>}
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
                          View Details
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Partner
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Partner
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
        onOpenChange={setIsModalOpen}
        user={selectedUser}
        onSuccess={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
          utils.user.getByRoleType.invalidate()
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) deleteMutation.mutate({ id: userToDelete.id })
        }}
        title="Delete Payroll Partner"
        description={`Are you sure you want to delete "${userToDelete?.name || userToDelete?.email}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
