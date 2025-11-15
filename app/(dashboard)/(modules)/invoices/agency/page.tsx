"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { LoadingState } from "@/components/shared/loading-state"
import { InvoiceModal } from "@/components/modals/invoice-modal"
import { toast } from "sonner"
import { useToast } from "@/hooks/use-toast"

export default function AgencyInvoicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const { toast: showToast } = useToast()
  
  // Fetch invoices
  const { data: invoices, isLoading, refetch } = api.invoice.getAll.useQuery()
  
  // Fetch stats
  const { data: stats } = api.invoice.getStats.useQuery()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "overdue": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }
  const rows = invoices?.invoices ?? [];

  if (isLoading) {
    return <LoadingState message="Loading invoices..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agency Invoices" description="Manage agency billing and invoices">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              showToast({
                title: "Export functionality",
                description: "Invoice export will be available soon",
              })
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setEditingInvoice(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overdue || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.paid || 0}</div>
          </CardContent>
        </Card>
      </div>

      <CardContent>
      {rows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No invoices found</p>
          <Button onClick={() => {
            setEditingInvoice(null)
            setModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Invoice
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber || "N/A"}</TableCell>
                  <TableCell>{inv.contract?.title || "N/A"}</TableCell>
                  <TableCell className="font-semibold">${inv.amount?.toString() || "0"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(inv.status)} variant="secondary">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingInvoice(inv)
                        setModalOpen(true)
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>


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
