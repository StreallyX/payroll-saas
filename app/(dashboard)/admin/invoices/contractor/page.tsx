
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Download, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { InvoiceModal } from "@/components/modals/invoice-modal"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ContractorInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  // Fetch all invoices
  const { data: allInvoices, isLoading, refetch } = api.invoice.getAll.useQuery()
  
  // Fetch stats
  const { data: stats } = api.invoice.getStats.useQuery()

  // Filter only contractor invoices
  const contractorInvoices = allInvoices?.filter(invoice => 
    invoice.contract.contractor !== null
  )

  // Delete mutation
  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => {
      toast.success("Facture deleted successfully!")
      refetch()
      setDeleteId(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete de la facture")
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": 
        return "bg-green-100 text-green-800"
      case "sent": 
        return "bg-blue-100 text-blue-800"
      case "draft": 
        return "bg-gray-100 text-gray-800"
      case "overdue": 
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default: 
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter invoices based on search
  const filteredInvoices = contractorInvoices?.filter(invoice => {
    const query = searchQuery.toLowerCase()
    return (
      invoice.invoiceRef?.toLowerCase().includes(query) ||
      invoice.contract.contractor?.user?.name?.toLowerCase().includes(query) ||
      invoice.contract.contractor?.user?.email?.toLowerCase().includes(query) ||
      invoice.status.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return <LoadingState message="Chargement des factures..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures Contractants"
        description="Manage la facturation et les paiements des contractants"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total des Factures"
          value={stats?.total || 0}
          icon={Download}
        />
        <StatsCard
          title="Payées"
          value={stats?.paid || 0}
          icon={Download}
        />
        <StatsCard
          title="En Retard"
          value={stats?.overdue || 0}
          icon={Download}
        />
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search des factures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("L'export sera bientôt disponible")
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => {
                  setEditingInvoice(null)
                  setModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Facture
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {!filteredInvoices || filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Download}
              title="Aucune facture trouvée"
              description={searchQuery ? "Essayez d'ajuster votre recherche" : "Commencez par créer votre première facture"}
              actionLabel={!searchQuery ? "New Facture" : undefined}
              onAction={() => {
                setEditingInvoice(null)
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
                    <TableHead>Référence</TableHead>
                    <TableHead>Contractant</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date Création</TableHead>
                    <TableHead>Date Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceRef || `INV-${invoice.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        {invoice.contract.contractor?.user?.name || "Non spécifié"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "dd/MM/yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingInvoice(invoice)
                              setModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(invoice.id)}
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
        title="Delete la Facture"
        description="Are you sure you want to delete cette facture ? Cette action est irréversible."
        isLoading={deleteMutation.isPending}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingInvoice(null)
        }}
        invoice={editingInvoice}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
