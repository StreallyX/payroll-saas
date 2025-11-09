

"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Coins } from "lucide-react"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { CurrencyModal } from "@/components/modals/currency-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function CurrenciesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: currencies = [], isLoading } = api.currency.getAll.useQuery()
  const utils = api.useUtils()

  const deleteMutation = api.currency.delete.useMutation({
    onSuccess: () => {
      toast.success("Currency deleted successfully!")
      utils.currency.getAll.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete currency")
    }
  })

  const handleEdit = (currency: any) => {
    setSelectedCurrency(currency)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const filteredCurrencies = currencies.filter((currency: any) =>
    currency?.code?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    currency?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Loading currencies..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currencies"
        description="Manage currencies"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedCurrency(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Currency
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCurrencies.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No currencies</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a currency.</p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Currency
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrencies.map((currency: any) => (
                <TableRow key={currency.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                        <Coins className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="font-medium">{currency.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={currency.isActive ? "default" : "secondary"}>
                      {currency.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(currency.id)}
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

      <CurrencyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        currency={selectedCurrency}
        onSuccess={() => {
          setSelectedCurrency(null)
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title="Delete Currency"
        description="Are you sure you want to delete this currency? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
