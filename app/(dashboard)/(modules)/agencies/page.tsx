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
  MoreHorizontal,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CompanyModal } from "@/components/modals/company-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function AgenciesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [companyToDelete, setCompanyToDelete] = useState<any>(null)
  const router = useRouter()

  // Fetch companies that are NOT platform entities (i.e., client companies / agencies)
  const { data: allCompanies = [], isLoading } = api.company.getAll.useQuery()
  const utils = api.useUtils()

  // Filter to show only client/agency companies (ownerType !== "tenant")
  const companies = allCompanies.filter((c: any) => c.ownerType !== "tenant")

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Agency/Client deleted successfully.")
      utils.company.getAll.invalidate()
      setCompanyToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete agency/client.")
    }
  })

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleDelete = (company: any) => {
    setCompanyToDelete(company)
  }

  const handleAddCompany = () => {
    setSelectedCompany(null)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return <LoadingPage />
  }

  const filteredCompanies = companies?.filter((company: any) =>
    (company?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company?.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company?.contactEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company?.country?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency / Clients"
        description="Manage your agency and client companies with their contacts."
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search agencies/clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button size="sm" onClick={handleAddCompany}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agency / Client
          </Button>
        </div>
      </PageHeader>

      {/* Companies Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCompanies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No agencies/clients</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? "No results match your search." : "Get started by adding your first agency or client."}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Button onClick={handleAddCompany}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Agency / Client
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies?.map((company: any) => (
                <TableRow key={company?.id} className="hover:bg-gray-50">
                  {/* Company Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{company?.name || "Unnamed Company"}</div>
                        {company?.website && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {company.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Person */}
                  <TableCell>
                    {company?.contactPerson ? (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {company.contactPerson}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No contact</span>
                    )}
                  </TableCell>

                  {/* Contact Email */}
                  <TableCell>
                    {company?.contactEmail ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${company.contactEmail}`} className="text-blue-600 hover:underline">
                          {company.contactEmail}
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    {company?.contactPhone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {company.contactPhone}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* Country */}
                  <TableCell>
                    {company?.country?.name || <span className="text-gray-400">-</span>}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={company?.status === "active" ? "default" : "secondary"}>
                      {company?.status || "active"}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => router.push(`/agencies/${company.id}`)}>
                          <Users className="h-4 w-4 mr-2" />
                          View / Add Contacts
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Company
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(company)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

      {/* Company Modal */}
      <CompanyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        company={selectedCompany}
        agencyMode={true}
        onSuccess={() => {
          setIsModalOpen(false)
          setSelectedCompany(null)
          utils.company.getAll.invalidate()
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!companyToDelete}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
        onConfirm={() => {
          if (companyToDelete) deleteMutation.mutate({ id: companyToDelete.id })
        }}
        title="Delete Agency/Client"
        description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
