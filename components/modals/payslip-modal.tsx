
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface PayslipModalProps {
  isOpen: boolean
  onClose: () => void
  payslip?: any
}

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
]

export function PayslipModal({ isOpen, onClose, payslip }: PayslipModalProps) {
  const utils = api.useContext()
  const [isLoading, setIsLoading] = useState(false)

  const { data: contractors } = api.contractor.getAll.useQuery()
  const { data: contracts } = api.contract.getAll.useQuery()

  const [formData, setFormData] = useState({
    contractorId: "",
    contractId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    grossPay: 0,
    netPay: 0,
    deductions: 0,
    tax: 0,
    status: "pending" as "pending" | "generated" | "sent" | "paid",
    sentDate: "",
    paidDate: "",
    notes: "",
  })

  useEffect(() => {
    if (payslip) {
      setFormData({
        contractorId: payslip.contractorId || "",
        contractId: payslip.contractId || "",
        month: payslip.month || new Date().getMonth() + 1,
        year: payslip.year || new Date().getFullYear(),
        grossPay: payslip.grossPay || 0,
        netPay: payslip.netPay || 0,
        deductions: payslip.deductions || 0,
        tax: payslip.tax || 0,
        status: payslip.status || "pending",
        sentDate: payslip.sentDate 
          ? new Date(payslip.sentDate).toISOString().split("T")[0] 
          : "",
        paidDate: payslip.paidDate 
          ? new Date(payslip.paidDate).toISOString().split("T")[0] 
          : "",
        notes: payslip.notes || "",
      })
    } else {
      setFormData({
        contractorId: "",
        contractId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        grossPay: 0,
        netPay: 0,
        deductions: 0,
        tax: 0,
        status: "pending",
        sentDate: "",
        paidDate: "",
        notes: "",
      })
    }
  }, [payslip, isOpen])

  const createMutation = api.payslip.create.useMutation({
    onSuccess: () => {
      toast.success("Bulletin de paie créé avec succès")
      utils.payslip.getAll.invalidate()
      utils.payslip.getStats.invalidate()
      onClose()
      setFormData({
        contractorId: "",
        contractId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        grossPay: 0,
        netPay: 0,
        deductions: 0,
        tax: 0,
        status: "pending",
        sentDate: "",
        paidDate: "",
        notes: "",
      })
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du bulletin: " + error.message)
    },
  })

  const updateMutation = api.payslip.update.useMutation({
    onSuccess: () => {
      toast.success("Bulletin de paie mis à jour avec succès")
      utils.payslip.getAll.invalidate()
      utils.payslip.getStats.invalidate()
      onClose()
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du bulletin: " + error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.contractorId) {
        toast.error("Veuillez sélectionner un contractor")
        setIsLoading(false)
        return
      }

      if (payslip) {
        await updateMutation.mutateAsync({
          id: payslip.id,
          ...formData,
          contractId: formData.contractId || undefined,
          sentDate: formData.sentDate || undefined,
          paidDate: formData.paidDate || undefined,
        })
      } else {
        await createMutation.mutateAsync({
          ...formData,
          contractId: formData.contractId || undefined,
          sentDate: formData.sentDate || undefined,
          paidDate: formData.paidDate || undefined,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payslip ? "Edit bulletin de paie" : "Create un nouveau bulletin de paie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractorId">Contractor *</Label>
              <Select
                value={formData.contractorId}
                onValueChange={(value) => setFormData({ ...formData, contractorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select un contractor" />
                </SelectTrigger>
                <SelectContent>
                  {contractors?.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.user.name || contractor.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractId">Contract (optionnel)</Label>
              <Select
                value={formData.contractId}
                onValueChange={(value) => setFormData({ ...formData, contractId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select un contract" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.title || contract.contractReference || contract.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Mois *</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Année *</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossPay">Salaire brut *</Label>
              <Input
                id="grossPay"
                type="number"
                min="0"
                step="0.01"
                value={formData.grossPay}
                onChange={(e) => setFormData({ ...formData, grossPay: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="netPay">Salaire net *</Label>
              <Input
                id="netPay"
                type="number"
                min="0"
                step="0.01"
                value={formData.netPay}
                onChange={(e) => setFormData({ ...formData, netPay: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Déductions</Label>
              <Input
                id="deductions"
                type="number"
                min="0"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax">Taxes</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="generated">Généré</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentDate">Date d'envoi</Label>
              <Input
                id="sentDate"
                type="date"
                value={formData.sentDate}
                onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidDate">Date de paiement</Label>
              <Input
                id="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {payslip ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
