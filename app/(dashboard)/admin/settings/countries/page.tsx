

"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Globe } from "lucide-react"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { CountryModal } from "@/components/modals/country-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function CountriesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: countries = [], isLoading } = api.country.getAll.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.country.delete.useMutation({
    onSuccess: () => {
      toast.success("Country deleted successfully!")
      utils.country.getAll.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete country")
    }
  })

  const handleEdit = (country: any) => {
    setSelectedCountry(country)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const filteredCountries = countries.filter((country: any) =>
    country?.code?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    country?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Loading countries..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Countries"
        description="Manage countries"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedCountry(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Country
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCountries.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No countries</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a country.</p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Country
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCountries.map((country: any) => (
                <TableRow key={country.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <Globe className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium">{country.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>{country.name}</TableCell>
                  <TableCell>
                    <Badge variant={country.isActive ? "default" : "secondary"}>
                      {country.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(country)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(country.id)}
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

      <CountryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        country={selectedCountry}
        onSuccess={() => {
          setSelectedCountry(null)
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title="Delete Country"
        description="Are you sure you want to delete this country? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
