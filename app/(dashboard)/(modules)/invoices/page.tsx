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
import { RouteGuard } from "@/components/guards/route-guard"
import { PermissionGuard } from "@/components/guards/permission-guard"
import { toast } from "sonner"
import { format } from "date-fns"

/**
 * Adaptive Invoices Page
 * 
 * Permissions:
 * - invoices.view_own: User sees only their own invoices
 * - invoices.manage.view_all: Admin sees all invoices
 * - invoices.create: Can create invoices
 * - invoices.update: Can edit invoices
 * - invoices.delete: Can delete invoices
 * 
 * Adaptive behavior:
 * - Contractors see only their invoices
 * - Admins see all invoices with management actions
 */
function InvoicesPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  // Fetch all invoices (API will filter based on user permissions)
  const { data: allInvoices, isLoading, refetch } = api.invoice.getAll.useQuery()

  const rows = allInvoices?.invoices ?? []

  // Filter invoices based on search
  const filteredInvoices = rows.filter((invoice) => {
    const search = searchQuery.toLowerCase()
    return (
      invoice.invoiceNumber?.toLowerCase().includes(search) ||
      invoice.contractor?.user?.firstName?.toLowerCase().includes(search) ||
      invoice.contractor?.user?.lastName?.toLowerCase().includes(search) ||
      invoice.status?.toLowerCase().includes(search)
    )
  })

  // Calculate stats
  const stats = {
    total: rows.length,
    pending: rows.filter(inv => inv.status === "pending").length,
    approved: rows.filter(inv => inv.status === "approved").length,
    paid: rows.filter(inv => inv.status === "paid").length,
    totalAmount: rows.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
  }

  const handleDelete = async (id: string) => {
    try {
      // Add your delete logic here
      toast.success("Invoice deleted successfully")
      refetch()
    } catch (error) {
      toast.error("Failed to delete invoice")
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingInvoice(null)
    refetch()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      pending: "outline",
      approved: "default",
      paid: "default",
      rejected: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  if (isLoading) {
    return <LoadingState message="Loading invoices..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="View and manage your invoices"
      >
        <PermissionGuard permission="invoices.create">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Invoices"
          value={stats.total}
          description="All invoices"
          icon={<Plus className="h-4 w-4" />}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          description="Awaiting approval"
          icon={<Loader2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Approved"
          value={stats.approved}
          description="Ready for payment"
          icon={<Download className="h-4 w-4" />}
        />
        <StatsCard
          title="Paid"
          value={stats.paid}
          description="Completed"
          icon={<Download className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Amount"
          value={`€${stats.totalAmount.toFixed(2)}`}
          description="Total value"
          icon={<Download className="h-4 w-4" />}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, contractor, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Get started by creating your first invoice"
          icon={<Plus className="h-12 w-12" />}
          action={
            <PermissionGuard permission="invoices.create">
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </PermissionGuard>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {invoice.contractor?.user?.firstName} {invoice.contractor?.user?.lastName}
                    </TableCell>
                    <TableCell>
                      {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>€{invoice.totalAmount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status || "draft")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <PermissionGuard permission="invoices.update">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="invoices.delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {modalOpen && (
        <InvoiceModal
          open={modalOpen}
          onClose={handleModalClose}
          invoice={editingInvoice}
        />
      )}

      {deleteId && (
        <DeleteConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => handleDelete(deleteId)}
          title="Delete Invoice"
          description="Are you sure you want to delete this invoice? This action cannot be undone."
        />
      )}
    </div>
  )
}

/**
 * Invoices page with route guard
 * Users need either view_own OR manage.view_all permission
 */
export default function InvoicesPage() {
  return (
    <RouteGuard
      permissions={["invoices.view_own", "invoices.manage.view_all"]}
      requireAll={false}
    >
      <InvoicesPageContent />
    </RouteGuard>
  )
}
