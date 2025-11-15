
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileDown, Pencil, Trash2, UserCheck, Building2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { ContractorModal } from "@/components/modals/contractor-modal"
import { useToast } from "@/hooks/use-toast"

export default function AdminContractorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<any>(null)
  const { toast } = useToast()

  // Fetch contractors
  const { data: contractors, isLoading, refetch } = api.contractor.getAll.useQuery()
  
  // Fetch stats
  const { data: stats } = api.contractor.getStats.useQuery()

  // Delete mutation
  const deleteMutation = api.contractor.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Contractor deleted",
        description: "The contractor has been deleted successfully.",
      })
      refetch()
      setDeleteId(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contractor.",
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter contractors based on search
  const filteredContractors = contractors?.filter(contractor => {
    const query = searchQuery.toLowerCase()
    return (
      contractor.user?.name?.toLowerCase().includes(query) ||
      contractor.user?.email.toLowerCase().includes(query) ||
      contractor.agency?.name?.toLowerCase().includes(query) ||
      contractor.status.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return <LoadingState message="Loading contractors..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Contractors"
        description="View and manage contractor profiles and assignments"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Contractors"
          value={stats?.total || 0}
          icon={UserCheck}
        />
        <StatsCard
          title="Active"
          value={stats?.active || 0}
          icon={UserCheck}
        />
        <StatsCard
          title="Inactive"
          value={stats?.inactive || 0}
          icon={UserCheck}
        />
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Export",
                    description: "Export functionality will be available soon",
                  })
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => {
                  setEditingContractor(null)
                  setModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contractor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contractors Table */}
      {!filteredContractors || filteredContractors.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={UserCheck}
              title="No contractors found"
              description={searchQuery ? "Try adjusting your search query" : "Get started by adding your first contractor"}
              actionLabel={!searchQuery ? "Add Contractor" : undefined}
              onAction={() => {
                setEditingContractor(null)
                setModalOpen(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-medium">
                            {contractor.user?.name?.[0] || contractor.user?.email?.[0] || "?"}
                          </div>
                          <span className="font-medium">{contractor.user?.name || "No name"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{contractor.user?.email}</TableCell>
                      <TableCell>
                        {contractor.agency ? (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            {contractor.agency.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No agency</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contractor.status)}>
                          {contractor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contractor._count?.contracts || 0} contracts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContractor(contractor)
                              setModalOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(contractor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Contractor"
        description="Are you sure you want to delete this contractor? This will also remove all associated contracts and data."
        isLoading={deleteMutation.isPending}
      />

      {/* Contractor Modal */}
      <ContractorModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingContractor(null)
        }}
        contractor={editingContractor}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
