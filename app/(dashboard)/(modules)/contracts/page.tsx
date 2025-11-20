"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, Plus, FileDown, Pencil, Trash2, FileText, Eye, 
  Calendar, TrendingUp, AlertTriangle, Users, Building2, UserPlus 
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { ContractModal } from "@/components/modals/contract-modal"
import { ContractViewModal } from "@/components/modals/contract-view-modal"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/guards/RouteGuard"

export default function ManageContractsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingContractId, setViewingContractId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  // ------------------------------------------
  // PERMISSIONS
  // ------------------------------------------
  const { data: session } = useSession()
  const permissions = session?.user?.permissions || []

  const canListGlobal = permissions.includes("contract.list.global")
  const canListTeam = permissions.includes("contract.list.team")
  const canReadOwn = permissions.includes("contract.read.own")

  const canCreate = permissions.includes("contract.create.global")
  const canUpdateGlobal = permissions.includes("contract.update.global")
  const canUpdateOwn = permissions.includes("contract.update.own")
  const canDelete = permissions.includes("contract.delete.global")
  const canExport = permissions.includes("contract.export.global")

  // ------------------------------------------
  // API CALLS ACCORDING TO PERMISSIONS
  // ------------------------------------------
  let contractQuery

  if (canListGlobal) {
    contractQuery = api.contract.getAll.useQuery()
  } else if (canListTeam) {
    // TODO: when implemented
    contractQuery = api.contract.getAll.useQuery() // fallback
  } else if (canReadOwn) {
    contractQuery = api.contract.getMyContracts.useQuery()
  } else {
    contractQuery = {
      data: [],
      isLoading: false,
      refetch: async () => ({ data: [], error: null })
    }
  }


  const { data: contracts = [], isLoading, refetch } = contractQuery

  const { data: stats } = canListGlobal
    ? api.contract.getStats.useQuery()
    : { data: { total: contracts?.length || 0 } }

  // ------------------------------------------
  // Prerequisites
  // ------------------------------------------
  const { data: contractors = [] } = api.contractor.getAll.useQuery()
  const { data: agencies = [] } = api.agency.getAll.useQuery()
  const { data: payrollPartners = [] } = api.payroll.getAll.useQuery()

  const hasPrerequisites =
    contractors.length > 0 &&
    agencies.length > 0 &&
    payrollPartners.length > 0

  // ------------------------------------------
  // DELETE
  // ------------------------------------------
  const deleteMutation = api.contract.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrat supprimé")
      refetch()
      setDeleteId(null)
    },
    onError: (err) =>
      toast.error(err.message || "Erreur lors de la suppression"),
  })

  const handleDelete = () => {
    if (deleteId) deleteMutation.mutate({ id: deleteId })
  }

  // ------------------------------------------
  // VIEW
  // ------------------------------------------
  const handleViewContract = (id: string) => {
    setViewingContractId(id)
    setViewModalOpen(true)
  }

  // ------------------------------------------
  // CATEGORISATION
  // ------------------------------------------
  const categorizedContracts = useMemo(() => {
    if (!contracts) return { active: [], expired: [], expiringSoon: [] }

    const now = new Date()
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const active: any[] = []
    const expired: any[] = []
    const expiringSoon: any[] = []

    contracts.forEach((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          c.title?.toLowerCase().includes(q) ||
          c.agency.name.toLowerCase().includes(q) ||
          c.contractor.user.name?.toLowerCase().includes(q)

        if (!matches) return
      }

      if (c.status !== "active") return

      const end = c.endDate ? new Date(c.endDate) : null

      if (!end) active.push(c)
      else if (end < now) expired.push(c)
      else if (end <= soon) expiringSoon.push(c)
      else active.push(c)
    })

    return { active, expired, expiringSoon }
  }, [contracts, searchQuery])

  if (isLoading) return <LoadingState message="Chargement..." />

  // ------------------------------------------
  // TABLE COMPONENT
  // ------------------------------------------
  const ContractTable = ({ contracts, emptyMessage }: any) => {
    if (contracts.length === 0) {
      return (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="Aucun contrat"
              description={emptyMessage}
            />
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agence/Client</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contracts.map((c: any) => {
                  const end = c.endDate ? new Date(c.endDate) : null
                  const days = end
                    ? Math.ceil(
                        (end.getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null

                  const canEdit =
                    canUpdateGlobal ||
                    (canUpdateOwn && c.createdBy === session?.user.id)

                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.agency.name}</TableCell>
                      <TableCell>
                        {c.contractor.user.name ||
                          c.contractor.user.email}
                      </TableCell>

                      <TableCell>
                        {c.rate
                          ? `${c.rate}/${c.rateType || "hr"}`
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {c.startDate
                          ? new Date(c.startDate).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {end
                          ? end.toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {days === null ? (
                          <span className="text-gray-500">∞</span>
                        ) : (
                          <Badge
                            variant={
                              days < 0
                                ? "destructive"
                                : days <= 30
                                ? "default"
                                : "secondary"
                            }
                          >
                            {days < 0 ? "Expiré" : `${days}j`}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <RouteGuard permission="contract.list.global">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(c.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </RouteGuard>

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingContract(c)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ------------------------------------------
  // PAGE UI
  // ------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Contrats"
        description="Visualisez et gérez vos contrats"
      />

      {/* PREREQUISITES */}
      {!hasPrerequisites && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            Vous devez d’abord configurer vos agences, contractors et
            payroll partners.
          </AlertDescription>
        </Alert>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Actifs"
          value={categorizedContracts.active.length}
          icon={TrendingUp}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Bientôt expirés"
          value={categorizedContracts.expiringSoon.length}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Expirés"
          value={categorizedContracts.expired.length}
          icon={Calendar}
          iconColor="text-red-600"
        />
        <StatsCard
          title="Total"
          value={stats?.total || 0}
          icon={FileText}
          iconColor="text-blue-600"
        />
      </div>

      {/* ACTION BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {canExport && (
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}

              {canCreate && (
                <Button
                  onClick={() => {
                    setEditingContract(null)
                    setModalOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Contrat
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Actifs
            <Badge variant="secondary" className="ml-2">
              {categorizedContracts.active.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="expiring">
            Bientôt expirés
            <Badge variant="secondary" className="ml-2">
              {categorizedContracts.expiringSoon.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="expired">
            Expirés
            <Badge variant="secondary" className="ml-2">
              {categorizedContracts.expired.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ContractTable
            contracts={categorizedContracts.active}
            emptyMessage="Aucun contrat actif."
          />
        </TabsContent>

        <TabsContent value="expiring">
          <ContractTable
            contracts={categorizedContracts.expiringSoon}
            emptyMessage="Aucun contrat expire bientôt."
          />
        </TabsContent>

        <TabsContent value="expired">
          <ContractTable
            contracts={categorizedContracts.expired}
            emptyMessage="Aucun contrat expiré."
          />
        </TabsContent>
      </Tabs>

      {/* DELETE CONFIRMATION */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        description="Cette action est irréversible."
        isLoading={deleteMutation.isPending}
      />

      {/* EDIT MODAL */}
      <ContractModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o)
          if (!o) setEditingContract(null)
        }}
        contract={editingContract}
        onSuccess={() => refetch()}
      />

      {/* VIEW MODAL */}
      <ContractViewModal
        open={viewModalOpen}
        onOpenChange={(o) => {
          setViewModalOpen(o)
          if (!o) setViewingContractId(null)
        }}
        contractId={viewingContractId}
      />
    </div>
  )
}
