
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileDown, Pencil, Trash2, Building2, Users, FileText, Eye  } from "lucide-react"
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
import { AgencyModal } from "@/components/modals/agency-modal"
import { useToast } from "@/hooks/use-toast"
import { AgencyViewModal } from "@/components/modals/agency-view-modal"

export default function AgenciesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState<any>(null)
  const { toast } = useToast()
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingAgency, setViewingAgency] = useState<any>(null)


  // Fetch agencies
  const { data: agencies, isLoading, refetch } = api.agency.getAll.useQuery()
  
  // Fetch stats
  const { data: stats } = api.agency.getStats.useQuery()

  // Delete mutation
  const deleteMutation = api.agency.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Agency deleted",
        description: "The agency has been deleted successfully.",
      })
      refetch()
      setDeleteId(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete agency.",
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

  // Filter agencies based on search
  const filteredAgencies = agencies?.filter(agency => {
    const query = searchQuery.toLowerCase()
    return (
      agency.name.toLowerCase().includes(query) ||
      agency.contactEmail.toLowerCase().includes(query) ||
      agency.status.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return <LoadingState message="Loading agencies..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agencies / Clients"
        description="Manage client organizations and staffing agencies"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Agencies"
          value={stats?.total || 0}
          icon={Building2}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Agencies"
          value={stats?.active || 0}
          icon={Building2}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Inactive Agencies"
          value={stats?.inactive || 0}
          icon={Building2}
          iconColor="text-gray-600"
        />
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search agencies by name, email, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Export functionality",
                    description: "Agency export will be available soon",
                  })
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => {
                  setEditingAgency(null)
                  setModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Agency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      {!filteredAgencies || filteredAgencies.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Building2}
              title="No agencies found"
              description={searchQuery ? "Try adjusting your search query" : "Get started by adding your first agency or client"}
              actionLabel={!searchQuery ? "Add Agency" : undefined}
              onAction={() => {
                setEditingAgency(null)
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
                    <TableHead>Agency Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contractors</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
                            {agency.name[0]?.toUpperCase()}
                          </div>
                          {agency.name}
                        </div>
                      </TableCell>
                      <TableCell>{agency.contactEmail}</TableCell>
                      <TableCell>{agency.contactPhone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(agency.status)}>
                          {agency.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{agency._count?.contractors || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{agency._count?.contracts || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingAgency(agency)
                              setViewOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAgency(agency)
                              setModalOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(agency.id)}
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
        title="Delete Agency"
        description="Are you sure you want to delete this agency? This will also remove all associated contractors and contracts."
        isLoading={deleteMutation.isPending}
      />

      {/* Agency Modal */}
      <AgencyModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingAgency(null)
        }}
        agency={editingAgency}
        onSuccess={() => refetch()}
      />
      <AgencyViewModal
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewingAgency(null)
        }}
        agency={viewingAgency}
      />
    </div>
  )
}
