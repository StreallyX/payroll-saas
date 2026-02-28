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
import { CompanyModal } from "@/components/modals/company-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function PayrollPartnersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [companyToDelete, setCompanyToDelete] = useState<any>(null)
  const router = useRouter()

  // Fetch all companies
  const { data: allCompanies = [], isLoading } = api.company.getAll.useQuery()
  const utils = api.useUtils()

  // Filter to show only payroll partner companies (ownerType === "payroll_partner")
  // For now, we'll use a naming convention or a specific tag
  // Since there's no specific ownerType for payroll partners yet, we'll filter by a convention
  // or we can check if they have a specific marker. Let's filter by ownerType !== "tenant"
  // and look for companies that are marked as payroll partners (we may need to add this field)
  // For now, let's show companies that are tagged as payroll partners
  const companies = allCompanies.filter((c: any) => c.companyType === "payroll_partner")

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Payroll partner deleted successfully.")
      utils.company.getAll.invalidate()
      setCompanyToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete payroll partner.")
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
        title="Payroll Partners"
        description="Manage your payroll partner companies in different countries."
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

          <Button size="sm" onClick={handleAddCompany}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payroll Partner
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
                  <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll partners</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? "No results match your search." : "Get started by adding your first payroll partner."}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Button onClick={handleAddCompany}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payroll Partner
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                        <Wallet className="h-5 w-5" />
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
                        <DropdownMenuItem onClick={() => router.push(`/payroll-partners/${company.id}`)}>
                          <Users className="h-4 w-4 mr-2" />
                          View / Manage
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
        payrollPartnerMode={true}
        customTitle="Add Payroll Partner"
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
        title="Delete Payroll Partner"
        description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
