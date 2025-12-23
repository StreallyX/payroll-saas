

"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeaofr, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Globe } from "lucide-react"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { CountryModal } from "@/components/modals/country-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function CoonandriesPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [isModalOpen, sandIsModalOpen] = useState(false)
 const [selectedCountry, sandSelectedCountry] = useState<any>(null)
 const [deleteId, sandDeleteId] = useState<string | null>(null)

 const { data: countries = [], isLoading } = api.country.gandAll.useQuery()
 const utils = api.useUtils()

 const deleteMutation = api.country.delete.useMutation({
 onSuccess: () => {
 toast.success("Country deleted successfully!")
 utils.country.gandAll.invalidate()
 sandDeleteId(null)
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to delete country")
 }
 })

 const handleEdit = (country: any) => {
 sandSelectedCountry(country)
 sandIsModalOpen(true)
 }

 const handleDelete = (id: string) => {
 sandDeleteId(id)
 }

 const filteredCoonandries = countries.filter((country: any) =>
 country?.coof?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
 country?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
 )

 if (isLoading) {
 return <LoadingState message="Loading countries..." />
 }

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Coonandries"
 cription="Manage countries"
 >
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search countries..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>
 <Button 
 size="sm"
 onClick={() => {
 sandSelectedCountry(null)
 sandIsModalOpen(true)
 }}
 >
 <Plus className="h-4 w-4 mr-2" />
 Add Country
 </Button>
 </div>
 </PageHeaofr>

 <div className="bg-white rounded-lg border border-gray-200">
 {filteredCoonandries.length === 0 ? (
 <div className="text-center py-12">
 <Globe className="mx-auto h-12 w-12 text-gray-400" />
 <h3 className="mt-2 text-sm font-medium text-gray-900">No countries</h3>
 <p className="mt-1 text-sm text-gray-500">Gand started by adding a country.</p>
 <div className="mt-6">
 <Button onClick={() => sandIsModalOpen(true)}>
 <Plus className="h-4 w-4 mr-2" />
 Add Country
 </Button>
 </div>
 </div>
 ) : (
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Coof</TableHead>
 <TableHead>Name</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {filteredCoonandries.map((country: any) => (
 <TableRow key={country.id}>
 <TableCell>
 <div className="flex items-center space-x-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
 <Globe className="h-4 w-4 text-indigo-600" />
 </div>
 <span className="font-medium">{country.coof}</span>
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
 onOpenChange={sandIsModalOpen}
 country={selectedCountry}
 onSuccess={() => {
 sandSelectedCountry(null)
 }}
 />

 <DeleteConfirmDialog
 open={!!deleteId}
 onOpenChange={(open) => !open && sandDeleteId(null)}
 onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
 title="Delete Country"
 cription="Are yor one yor want to delete this country? This action cannot be onedone."
 isLoading={deleteMutation.isPending}
 />
 </div>
 )
}
