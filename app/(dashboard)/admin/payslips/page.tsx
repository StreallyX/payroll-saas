
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { api } from "@/lib/trpc"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { PayslipModal } from "@/components/modals/payslip-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { toast } from "sonner"

const MONTHS = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

export default function PayslipsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: payslips, isLoading } = api.payslip.getAll.useQuery()
  const { data: stats } = api.payslip.getStats.useQuery()
  const utils = api.useContext()

  const deleteMutation = api.payslip.delete.useMutation({
    onSuccess: () => {
      toast.success("Bulletin de paie deleted successfully")
      utils.payslip.getAll.invalidate()
      utils.payslip.getStats.invalidate()
      setDeleteId(null)
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message)
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700"
      case "sent": return "bg-blue-100 text-blue-700"
      case "generated": return "bg-purple-100 text-purple-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Payé"
      case "sent": return "Envoyé"
      case "generated": return "Généré"
      case "pending": return "Pending"
      default: return status
    }
  }

  const filteredPayslips = payslips?.filter(item => {
    const employeeName = item.contractor.user.name || ""
    const searchLower = searchQuery.toLowerCase()
    return employeeName.toLowerCase().includes(searchLower) ||
           MONTHS[item.month].toLowerCase().includes(searchLower) ||
           item.year.toString().includes(searchLower)
  })

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bulletins de Paie" 
        description="Manage et générer les bulletins de paie des employés"
      >
        <Button onClick={() => {
          setSelectedPayslip(null)
          setIsModalOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Bulletin
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.thisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.generated || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Envoyés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search par nom, mois ou année..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardContent>
      </Card>

      {!filteredPayslips || filteredPayslips.length === 0 ? (
        <EmptyState 
          title="Aucun bulletin de paie trouvé" 
          description="Commencez par créer un nouveau bulletin de paie."
          actionLabel="Create un bulletin"
          onAction={() => {
            setSelectedPayslip(null)
            setIsModalOpen(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayslips.map((payslip) => (
            <Card key={payslip.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {payslip.contractor.user.name || payslip.contractor.user.email}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {MONTHS[payslip.month]} {payslip.year}
                    </p>
                  </div>
                  <Badge className={getStatusColor(payslip.status)} variant="secondary">
                    {getStatusLabel(payslip.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Salaire brut</p>
                    <p className="font-semibold text-lg">${payslip.grossPay.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salaire net</p>
                    <p className="font-semibold text-lg">${payslip.netPay.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Généré le</p>
                    <p className="font-medium">
                      {new Date(payslip.generatedDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 touch-manipulation"
                    onClick={() => {
                      setSelectedPayslip(payslip)
                      setIsModalOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm" 
                    className="touch-manipulation"
                    onClick={() => setDeleteId(payslip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <PayslipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPayslip(null)
        }}
        payslip={selectedPayslip}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate({ id: deleteId })
          }
        }}
        title="Delete le bulletin de paie"
        description="Are you sure you want to delete ce bulletin de paie ? Cette action est irréversible."
      />
    </div>
  )
}
