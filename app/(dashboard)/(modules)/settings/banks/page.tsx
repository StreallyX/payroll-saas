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
  TableRow
} from "@/components/ui/table"

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Landmark
} from "lucide-react"

import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { BankModal } from "@/components/modals/bank-modal"
import { LoadingState } from "@/components/shared/loading-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { useSession } from "next-auth/react"

export default function BanksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: session } = useSession()
  const utils = api.useUtils()

  // -------------------------------------------------------
  // Permissions
  // -------------------------------------------------------
  const canListGlobal = session?.user.permissions.includes("bank.list.global")
  const canListOwn    = session?.user.permissions.includes("bank.list.own")

  const canCreate     = session?.user.permissions.includes("bank.create.global")
  const canUpdate     = session?.user.permissions.includes("bank.update.global")
  const canDelete     = session?.user.permissions.includes("bank.delete.global")

  // -------------------------------------------------------
  // Load correct data source based on permissions
  // -------------------------------------------------------
  const banksQuery = api.bank[
    canListGlobal ? "getAll" : "getMine"
  ].useQuery()

  const banks = banksQuery.data ?? []
  const isLoading = banksQuery.isLoading

  // -------------------------------------------------------
  // Delete bank
  // -------------------------------------------------------
  const deleteMutation = api.bank.delete.useMutation({
    onSuccess: () => {
      toast.success("Bank deleted successfully!")
      utils.bank.getAll.invalidate()
      utils.bank.getMine.invalidate()
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete bank")
    }
  })

  // -------------------------------------------------------
  // Table logic
  // -------------------------------------------------------
  const filteredBanks = banks.filter((bank: any) =>
    bank?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingState message="Loading banks..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banks"
        description="Manage bank accounts"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* CREATE button only if permission */}
          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedBank(null)
                setIsModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg border border-gray-200">
        {filteredBanks.length === 0 ? (
          <div className="text-center py-12">
            <Landmark className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No banks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a bank account.
            </p>

            {canCreate && (
              <div className="mt-6">
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>SWIFT/IBAN</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredBanks.map((bank: any) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <Landmark className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">{bank.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>{bank.accountNumber || "-"}</TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {bank.swiftCode && <div>SWIFT: {bank.swiftCode}</div>}
                      {bank.iban && (
                        <div className="text-gray-500">IBAN: {bank.iban}</div>
                      )}
                      {!bank.swiftCode && !bank.iban && "-"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={bank.status === "active" ? "default" : "secondary"}>
                      {bank.status}
                    </Badge>
                  </TableCell>

                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">

                        {/* EDIT only if allowed */}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBank(bank)
                              setIsModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {/* DELETE only if allowed */}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(bank.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* MODAL */}
      {canCreate || canUpdate ? (
        <BankModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          bank={selectedBank}
          onSuccess={() => {
            setSelectedBank(null)
          }}
        />
      ) : null}

      {/* DELETE CONFIRM */}
      {canDelete && (
        <DeleteConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
          title="Delete Bank"
          description="Are you sure you want to delete this bank? This action cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
