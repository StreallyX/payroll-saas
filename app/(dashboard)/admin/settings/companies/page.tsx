

"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { CompanyModal } from "@/components/modals/company-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: companies = [], isLoading } = api.company.getAll.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted successfully!")
      utils.company.getAll.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete organization")
    }
  })

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const filteredCompanies = companies.filter((company: any) =>
    company?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Loading organizations..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Manage your organizations"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedCompany(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new organization.</p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company: any) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {company.contactPerson && <div>{company.contactPerson}</div>}
                      {company.contactEmail && <div className="text-gray-500">{company.contactEmail}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{company.country?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={company.status === "active" ? "default" : "secondary"}>
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(company.id)}
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

      <CompanyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        company={selectedCompany}
        onSuccess={() => {
          setSelectedCompany(null)
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title="Delete Organization"
        description="Are you sure you want to delete this organization? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
