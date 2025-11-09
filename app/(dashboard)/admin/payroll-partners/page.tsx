
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, DollarSign, Mail, Phone, Edit, Trash2 } from "lucide-react"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { PayrollPartnerModal } from "@/components/modals/payroll-partner-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function AdminPayrollPartnersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: partners = [], isLoading } = api.payroll.getAll.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.payroll.delete.useMutation({
    onSuccess: () => {
      toast.success("Payroll partner deleted successfully!")
      utils.payroll.getAll.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete payroll partner")
    }
  })

  const handleEdit = (partner: any) => {
    setSelectedPartner(partner)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const filteredPartners = partners.filter((partner: any) =>
    partner?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Loading payroll partners..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Payroll Partners"
        description="View and manage payroll service providers"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedPartner(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll partners</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a payroll partner.</p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Partner
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner: any) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">{partner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-gray-400" />
                        {partner.contactEmail}
                      </div>
                      {partner.contactPhone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-2 text-gray-400" />
                          {partner.contactPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{partner._count?.contracts || 0} contracts</TableCell>
                  <TableCell>
                    <Badge variant={partner.status === "active" ? "default" : "secondary"}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(partner.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(partner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(partner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PayrollPartnerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        partner={selectedPartner}
        onSuccess={() => {
          setSelectedPartner(null)
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title="Delete Payroll Partner"
        description="Are you sure you want to delete this payroll partner? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
