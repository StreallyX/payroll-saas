"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, FileType, CheckCircle2, XCircle } from "lucide-react"
import { DocumentTypeModal } from "@/components/modals/document-type-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

export default function ManageDocumentTypesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<any>(null)
  const [docTypeToDelete, setDocTypeToDelete] = useState<any>(null)

  // Fetch document types from API
  const { data: documentTypes = [], isLoading } = api.documentType.getAll.useQuery()
  const { data: stats } = api.documentType.getStats.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.documentType.delete.useMutation({
    onSuccess: () => {
      toast.success("Type de document deleted successfully!")
      utils.documentType.getAll.invalidate()
      utils.documentType.getStats.invalidate()
      setDocTypeToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete du type de document")
    }
  })

  const handleEdit = (docType: any) => {
    setSelectedDocType(docType)
    setIsModalOpen(true)
  }

  const handleDelete = (docType: any) => {
    setDocTypeToDelete(docType)
  }

  const handleAddDocType = () => {
    setSelectedDocType(null)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return <LoadingState message="Chargement des types de documents..." />
  }

  const filteredDocTypes = documentTypes?.filter(docType =>
    docType?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    docType?.description?.toLowerCase()?.includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Types de documents"
        description="Configurez les types de documents requis pour l'onboarding"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search un type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button size="sm" onClick={handleAddDocType}>
            <Plus className="h-4 w-4 mr-2" />
            New type
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileType className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Obligatoires</p>
                <p className="text-2xl font-bold mt-1">{stats.required}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optionnels</p>
                <p className="text-2xl font-bold mt-1">{stats.optional}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actives</p>
                <p className="text-2xl font-bold mt-1">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Document Types Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Obligatoire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocTypes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm ? "Aucun type de document trouvé." : "Aucun type de document configuré."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocTypes?.map((docType) => (
                <TableRow key={docType?.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <FileType className="h-5 w-5 text-blue-600" />
                      <span>{docType?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {docType?.description || "-"}
                  </TableCell>
                  <TableCell>
                    {docType?.isRequired ? (
                      <Badge className="bg-red-100 text-red-700" variant="secondary">
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {docType?.isActive ? (
                      <Badge className="bg-green-100 text-green-700" variant="secondary">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(docType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(docType)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Document Type Modal */}
      <DocumentTypeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        documentType={selectedDocType}
        onSuccess={() => {
          setIsModalOpen(false)
          setSelectedDocType(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!docTypeToDelete}
        onOpenChange={(open) => !open && setDocTypeToDelete(null)}
        onConfirm={() => {
          if (docTypeToDelete) {
            deleteMutation.mutate({ id: docTypeToDelete.id })
          }
        }}
        title="Delete le type de document"
        description={`Are you sure you want to delete "${docTypeToDelete?.name}" ? Cette action est irréversible.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
