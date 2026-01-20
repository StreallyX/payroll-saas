"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Building2, Landmark, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { CompanyModal } from "@/components/modals/company-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function CompaniesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openModalParam = searchParams.get("openModal")

  const [searchTerm, setSearchTerm] = useState("")
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Auto-open modal if coming back from bank creation
  useEffect(() => {
    if (openModalParam === "true") {
      setIsModalOpen(true)
      // Clean up URL params
      router.replace("/settings/companies", { scroll: false })
    }
  }, [openModalParam, router])

  const { data: companies = [], isLoading } = api.company.getAll.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Company deleted successfully!")
      utils.company.getAll.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete company")
    }
  })

  const filtered = companies.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
    const matchesOwnerType = ownerTypeFilter === "all" || c.ownerType === ownerTypeFilter
    return matchesSearch && matchesOwnerType
  })

  // Count for stats
  const tenantCount = companies.filter((c: any) => c.ownerType === "tenant").length
  const clientCount = companies.filter((c: any) => c.ownerType !== "tenant").length

  if (isLoading) {
    return <LoadingState message="Loading companies..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage your platform entities and client companies"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies ({companies.length})</SelectItem>
              <SelectItem value="tenant">Our Entities ({tenantCount})</SelectItem>
              <SelectItem value="user">Client Companies ({clientCount})</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => {
              setSelectedCompany(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first company.</p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((company: any) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        company.ownerType === "tenant"
                          ? "bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-300"
                          : "bg-blue-100"
                      }`}>
                        <Building2 className={`h-4 w-4 ${
                          company.ownerType === "tenant" ? "text-indigo-700" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {company.ownerType === "tenant" ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                      >
                        Platform
                      </Badge>
                    ) : (
                      <div className="text-sm">
                        <span className="font-medium">{company.owner?.name || company.owner?.email || "Unknown"}</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {company.contactPerson}
                      {company.contactEmail && (
                        <div className="text-gray-500">{company.contactEmail}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* 🔥 NEW: Bank */}
                  <TableCell>
                    {company.bank ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Landmark className="h-4 w-4 text-gray-500" />
                        {company.bank.name}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No bank</span>
                    )}
                  </TableCell>

                  <TableCell>{company.country?.name || "-"}</TableCell>

                  <TableCell>
                    <Badge
                      variant={company.status === "active" ? "default" : "secondary"}
                    >
                      {company.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(company.id)}
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

      {/* MODAL CREATE/EDIT */}
      <CompanyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        company={selectedCompany}
        onSuccess={() => {
          setSelectedCompany(null)
          utils.company.getAll.invalidate()
        }}
      />

      {/* DELETE CONFIRM */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title="Delete Company"
        description="Are you sure? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
