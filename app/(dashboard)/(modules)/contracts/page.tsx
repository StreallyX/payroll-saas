
"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, FileDown, Pencil, Trash2, FileText, Eye, Calendar, TrendingUp, AlertTriangle, Users, Building2, UserPlus } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { ContractModal } from "@/components/modals/contract-modal"
import { ContractViewModal } from "@/components/modals/contract-view-modal"
import { toast } from "sonner"
import { downloadFile } from "@/lib/s3"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/guards/RouteGuard";


export default function ManageContractsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingContractId, setViewingContractId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];
  const canViewAll = permissions.includes("contracts.manage.view_all");
  const canViewOwn = permissions.includes("contracts.view_own");

  // Fetch contracts
  const {
    data: contracts,
    isLoading,
    refetch
  } = canViewAll
    ? api.contract.getAll.useQuery()
    : api.contract.getMyContracts.useQuery();

  
  // Fetch stats
  const { data: stats } = canViewAll
    ? api.contract.getStats.useQuery()
    : { data: { total: contracts?.length || 0 } };


  // Check prerequisites
  const { data: contractors = [] } = api.contractor.getAll.useQuery()
  const { data: agencies = [] } = api.agency.getAll.useQuery()
  const { data: payrollPartners = [] } = api.payroll.getAll.useQuery()

  const hasPrerequisites = contractors.length > 0 && agencies.length > 0 && payrollPartners.length > 0
  const missingPrerequisites = []
  if (contractors.length === 0) missingPrerequisites.push("contractors")
  if (agencies.length === 0) missingPrerequisites.push("agencies")
  if (payrollPartners.length === 0) missingPrerequisites.push("payroll partners")

  // Delete mutation
  const deleteMutation = api.contract.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrat deleted successfully")
      refetch()
      setDeleteId(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete du contrat")
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId })
    }
  }

  const handleViewContract = (contractId: string) => {
    setViewingContractId(contractId)
    setViewModalOpen(true)
  }

  // Categorize contracts
  const categorizedContracts = useMemo(() => {
    if (!contracts) return { active: [], expired: [], expiringSoon: [] }

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const active: any[] = []
    const expired: any[] = []
    const expiringSoon: any[] = []

    contracts.forEach((contract) => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          contract.title?.toLowerCase().includes(query) ||
          contract.agency.name.toLowerCase().includes(query) ||
          contract.contractor.user.name?.toLowerCase().includes(query) ||
          contract.status.toLowerCase().includes(query)
        
        if (!matchesSearch) return
      }

      // Only categorize active contracts
      if (contract.status !== "active") return

      const endDate = contract.endDate ? new Date(contract.endDate) : null

      if (!endDate) {
        // No end date = active indefinitely
        active.push(contract)
      } else if (endDate < now) {
        // Past end date = expired
        expired.push(contract)
      } else if (endDate <= thirtyDaysFromNow) {
        // Within 30 days = expiring soon
        expiringSoon.push(contract)
      } else {
        // Future end date = active
        active.push(contract)
      }
    })

    return { active, expired, expiringSoon }
  }, [contracts, searchQuery])

  if (isLoading) {
    return <LoadingState message="Chargement des contrats..." />
  }

  const ContractTable = ({ contracts, emptyMessage }: { contracts: any[], emptyMessage: string }) => {
    if (contracts.length === 0) {
      return (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="Aucun contrat trouvé"
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
                  <TableHead>Date Début</TableHead>
                  <TableHead>Date Fin</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const endDate = contract.endDate ? new Date(contract.endDate) : null
                  const daysRemaining = endDate 
                    ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null

                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.agency.name}
                      </TableCell>
                      <TableCell>
                        {contract.contractor.user.name || contract.contractor.user.email}
                      </TableCell>
                      <TableCell>
                        {contract.rate && contract.currency 
                          ? `${contract.currency.symbol}${contract.rate.toString()}/${contract.rateType || 'hr'}`
                          : contract.rate 
                          ? `$${contract.rate.toString()}/${contract.rateType || 'hr'}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell>
                        {endDate ? endDate.toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell>
                        {daysRemaining !== null ? (
                          <Badge variant={daysRemaining < 0 ? "destructive" : daysRemaining <= 30 ? "default" : "secondary"}>
                            {daysRemaining < 0 ? "Expiré" : `${daysRemaining} jours`}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">∞</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <RouteGuard permission="contracts.view">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(contract.id)}
                              title="View contract details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </RouteGuard>
                          <RouteGuard permission="contracts.manage.edit">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingContract(contract)
                                setModalOpen(true)
                              }}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </RouteGuard>
                          <RouteGuard permission="contracts.manage.delete">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(contract.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </RouteGuard>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Contrats"
        description="Visualisez et gérez tous les contrats par catégorie"
      />

      {/* Prerequisites Warning */}
      {!hasPrerequisites && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong className="text-orange-900">Prerequisites Required</strong>
                <p className="text-sm text-orange-800 mt-1">
                  Before creating contracts, you need to set up the following:
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {contractors.length === 0 && (
                  <Link href="/team/contractors">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
                      <Users className="h-8 w-8 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">Add Contractors</p>
                        <p className="text-xs text-gray-600">Create your first contractor</p>
                      </div>
                      <UserPlus className="h-4 w-4 text-orange-600" />
                    </div>
                  </Link>
                )}
                
                {agencies.length === 0 && (
                  <Link href="/team/agencies">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
                      <Building2 className="h-8 w-8 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">Add Agencies</p>
                        <p className="text-xs text-gray-600">Create your first agency/client</p>
                      </div>
                      <Plus className="h-4 w-4 text-orange-600" />
                    </div>
                  </Link>
                )}
                
                {payrollPartners.length === 0 && (
                  <Link href="/team/payroll-partners">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
                      <FileText className="h-8 w-8 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">Add Payroll Partner</p>
                        <p className="text-xs text-gray-600">Set up your payroll entity</p>
                      </div>
                      <Plus className="h-4 w-4 text-orange-600" />
                    </div>
                  </Link>
                )}
              </div>

              <p className="text-xs text-orange-700 mt-2">
                💡 <strong>Tip:</strong> You can also create these directly from the "New Contract" modal using the + buttons.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Contrats Actives"
          value={categorizedContracts.active.length}
          icon={TrendingUp}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Expirent Bientôt"
          value={categorizedContracts.expiringSoon.length}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Contrats Expirés"
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

      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search par agence, contractor, ou statut..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  toast.info("Fonctionnalité d'export bientôt disponible")
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <RouteGuard permission="contracts.manage.create">
                <Button
                  onClick={() => {
                    setEditingContract(null)
                    setModalOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Contrat
                </Button>
              </RouteGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Contract Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="active" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab("active")}
          >
            <TrendingUp className="h-4 w-4" />
            Contrats Actives
            <Badge variant="secondary" className="ml-1">
              {categorizedContracts.active.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="expiring" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab("expiring")}
          >
            <AlertTriangle className="h-4 w-4" />
            Expirent Bientôt
            <Badge variant="secondary" className="ml-1">
              {categorizedContracts.expiringSoon.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="expired" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab("expired")}
          >
            <Calendar className="h-4 w-4" />
            Expirés
            <Badge variant="secondary" className="ml-1">
              {categorizedContracts.expired.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ContractTable 
            contracts={categorizedContracts.active} 
            emptyMessage="Aucun contrat actif. Les contrats actifs sont ceux qui n'expirent pas dans les 30 prochains jours."
          />
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <ContractTable 
            contracts={categorizedContracts.expiringSoon} 
            emptyMessage="Aucun contrat n'expire dans les 30 prochains jours."
          />
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <ContractTable 
            contracts={categorizedContracts.expired} 
            emptyMessage="Aucun contrat expiré."
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete le Contrat"
        description="Are you sure you want to delete ce contrat ? Cette action est irréversible et supprimera également toutes les factures associées."
        isLoading={deleteMutation.isPending}
      />

      {/* Contract Modal */}
      <ContractModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingContract(null)
        }}
        contract={editingContract}
        onSuccess={() => refetch()}
      />

      {/* Contract View Modal */}
      <ContractViewModal
        open={viewModalOpen}
        onOpenChange={(open) => {
          setViewModalOpen(open)
          if (!open) setViewingContractId(null)
        }}
        contractId={viewingContractId}
      />
    </div>
  )
}
