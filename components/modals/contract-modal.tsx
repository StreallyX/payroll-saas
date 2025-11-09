
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type ContractModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: {
    id: string
    title?: string
    description?: string
    agencyId: string
    contractorId: string
    payrollPartnerId: string
    companyId?: string | null
    currencyId?: string | null
    bankId?: string | null
    contractCountryId?: string | null
    status: string
    rate?: number
    rateType?: string
    startDate?: Date | string
    endDate?: Date | string
    margin?: number | null
    marginType?: string | null
    marginPaidBy?: string | null
    salaryType?: string | null
    invoiceDueDays?: number | null
    contractReference?: string | null
    contractVatRate?: number | null
    agencySignDate?: Date | string | null
    contractorSignDate?: Date | string | null
    notes?: string | null
    signedContractPath?: string | null
  }
  onSuccess?: () => void
}

export function ContractModal({ open, onOpenChange, contract, onSuccess }: ContractModalProps) {
  const [formData, setFormData] = useState({
    title: contract?.title || "",
    description: contract?.description || "",
    agencyId: contract?.agencyId || "",
    contractorId: contract?.contractorId || "",
    payrollPartnerId: contract?.payrollPartnerId || "",
    companyId: contract?.companyId || "",
    currencyId: contract?.currencyId || "",
    bankId: contract?.bankId || "",
    contractCountryId: contract?.contractCountryId || "",
    status: contract?.status || "draft",
    rate: contract?.rate?.toString() || "",
    rateType: contract?.rateType || "hourly",
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
    margin: contract?.margin?.toString() || "",
    marginType: contract?.marginType || "percentage",
    marginPaidBy: contract?.marginPaidBy || "client",
    salaryType: contract?.salaryType || "gross",
    invoiceDueDays: contract?.invoiceDueDays?.toString() || "",
    contractReference: contract?.contractReference || "",
    contractVatRate: contract?.contractVatRate?.toString() || "",
    agencySignDate: contract?.agencySignDate ? new Date(contract.agencySignDate).toISOString().split('T')[0] : "",
    contractorSignDate: contract?.contractorSignDate ? new Date(contract.contractorSignDate).toISOString().split('T')[0] : "",
    notes: contract?.notes || "",
    signedContractPath: contract?.signedContractPath || ""
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const utils = api.useUtils()

  // Fetch agencies, contractors, payroll partners, companies, currencies, banks, and countries
  const { data: agencies = [] } = api.agency.getAll.useQuery()
  const { data: contractors = [] } = api.contractor.getAll.useQuery()
  const { data: payrollPartners = [] } = api.payroll.getAll.useQuery()
  const { data: companies = [] } = api.company.getAll.useQuery()
  const { data: currencies = [] } = api.currency.getAll.useQuery()
  const { data: banks = [] } = api.bank.getAll.useQuery()
  const { data: countries = [] } = api.country.getAll.useQuery()

  const createMutation = api.contract.create.useMutation({
    onSuccess: () => {
      toast.success("Contract created successfully!")
      utils.contract.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create contract")
    }
  })

  const updateMutation = api.contract.update.useMutation({
    onSuccess: () => {
      toast.success("Contract updated successfully!")
      utils.contract.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update contract")
    }
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      agencyId: "",
      contractorId: "",
      payrollPartnerId: "",
      companyId: "",
      currencyId: "",
      bankId: "",
      contractCountryId: "",
      status: "draft",
      rate: "",
      rateType: "hourly",
      startDate: "",
      endDate: "",
      margin: "",
      marginType: "percentage",
      marginPaidBy: "client",
      salaryType: "gross",
      invoiceDueDays: "",
      contractReference: "",
      contractVatRate: "",
      agencySignDate: "",
      contractorSignDate: "",
      notes: "",
      signedContractPath: ""
    })
  }

  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title || "",
        description: contract.description || "",
        agencyId: contract.agencyId,
        contractorId: contract.contractorId,
        payrollPartnerId: contract.payrollPartnerId,
        companyId: contract.companyId || "",
        currencyId: contract.currencyId || "",
        bankId: contract.bankId || "",
        contractCountryId: contract.contractCountryId || "",
        status: contract.status,
        rate: contract.rate?.toString() || "",
        rateType: contract.rateType || "hourly",
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
        margin: contract.margin?.toString() || "",
        marginType: contract.marginType || "percentage",
        marginPaidBy: contract.marginPaidBy || "client",
        salaryType: contract.salaryType || "gross",
        invoiceDueDays: contract.invoiceDueDays?.toString() || "",
        contractReference: contract.contractReference || "",
        contractVatRate: contract.contractVatRate?.toString() || "",
        agencySignDate: contract.agencySignDate ? new Date(contract.agencySignDate).toISOString().split('T')[0] : "",
        contractorSignDate: contract.contractorSignDate ? new Date(contract.contractorSignDate).toISOString().split('T')[0] : "",
        notes: contract.notes || "",
        signedContractPath: contract.signedContractPath || ""
      })
    }
  }, [contract])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont autorisés")
        e.target.value = ""
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 10 Mo")
        e.target.value = ""
        return
      }
      setUploadedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let signedContractPath = formData.signedContractPath

    // Upload file if a new one is selected
    if (uploadedFile) {
      setUploading(true)
      try {
        const fileFormData = new FormData()
        fileFormData.append("file", uploadedFile)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Échec de l'upload")
        }

        const data = await response.json()
        signedContractPath = data.cloud_storage_path
        toast.success("Fichier uploadé avec succès")
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'upload du fichier")
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const payload = {
      title: formData.title || undefined,
      description: formData.description || undefined,
      agencyId: formData.agencyId,
      contractorId: formData.contractorId,
      payrollPartnerId: formData.payrollPartnerId,
      companyId: formData.companyId || undefined,
      currencyId: formData.currencyId || undefined,
      bankId: formData.bankId || undefined,
      contractCountryId: formData.contractCountryId || undefined,
      status: formData.status as "draft" | "active" | "completed" | "cancelled",
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      rateType: formData.rateType as "hourly" | "daily" | "monthly" | "fixed" | undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      margin: formData.margin ? parseFloat(formData.margin) : undefined,
      marginType: formData.marginType as "percentage" | "fixed" | undefined,
      marginPaidBy: formData.marginPaidBy as "client" | "contractor" | undefined,
      salaryType: formData.salaryType as "gross" | "net" | undefined,
      invoiceDueDays: formData.invoiceDueDays ? parseInt(formData.invoiceDueDays) : undefined,
      contractReference: formData.contractReference || undefined,
      contractVatRate: formData.contractVatRate ? parseFloat(formData.contractVatRate) : undefined,
      agencySignDate: formData.agencySignDate ? new Date(formData.agencySignDate) : undefined,
      contractorSignDate: formData.contractorSignDate ? new Date(formData.contractorSignDate) : undefined,
      notes: formData.notes || undefined,
      signedContractPath: signedContractPath || undefined
    }

    if (contract) {
      updateMutation.mutate({
        id: contract.id,
        ...payload
      })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Contract" : "New Contract"}</DialogTitle>
          <DialogDescription>
            {contract ? "Mettez à jour les informations du contrat." : "Remplissez les détails pour créer un nouveau contrat."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Contract Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Développeur Full-Stack"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencyId">Agence *</Label>
              <Select value={formData.agencyId} onValueChange={(value) => setFormData({ ...formData, agencyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.length === 0 ? (
                    <SelectItem value="none" disabled>Aucune agence disponible</SelectItem>
                  ) : (
                    agencies.map((agency: any) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorId">Contractor *</Label>
              <Select value={formData.contractorId} onValueChange={(value) => setFormData({ ...formData, contractorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {contractors.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun contractor disponible</SelectItem>
                  ) : (
                    contractors.map((contractor: any) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.user?.name || contractor.user?.email || 'Unknown'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payrollPartnerId">Payroll Partner *</Label>
              <Select value={formData.payrollPartnerId} onValueChange={(value) => setFormData({ ...formData, payrollPartnerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {payrollPartners.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun partenaire disponible</SelectItem>
                  ) : (
                    payrollPartners.map((partner: any) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Tarif</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateType">Type de Tarif</Label>
              <Select value={formData.rateType} onValueChange={(value) => setFormData({ ...formData, rateType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Journalier</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Compagnie</Label>
              <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="none" disabled>Aucune compagnie</SelectItem>
                  ) : (
                    companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyId">Currency</Label>
              <Select value={formData.currencyId} onValueChange={(value) => setFormData({ ...formData, currencyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.length === 0 ? (
                    <SelectItem value="none" disabled>Aucune devise</SelectItem>
                  ) : (
                    currencies.map((currency: any) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankId">Bank</Label>
              <Select value={formData.bankId} onValueChange={(value) => setFormData({ ...formData, bankId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {banks.length === 0 ? (
                    <SelectItem value="none" disabled>Aucune banque</SelectItem>
                  ) : (
                    banks.map((bank: any) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractCountryId">Pays</Label>
              <Select value={formData.contractCountryId} onValueChange={(value) => setFormData({ ...formData, contractCountryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {countries.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun pays</SelectItem>
                  ) : (
                    countries.map((country: any) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="margin">Margin</Label>
              <Input
                id="margin"
                type="number"
                step="0.01"
                value={formData.margin}
                onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                placeholder="10.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginType">Type de Margin</Label>
              <Select value={formData.marginType} onValueChange={(value) => setFormData({ ...formData, marginType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginPaidBy">Margin Paid By</Label>
              <Select value={formData.marginPaidBy} onValueChange={(value) => setFormData({ ...formData, marginPaidBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryType">Salary Type</Label>
              <Select value={formData.salaryType} onValueChange={(value) => setFormData({ ...formData, salaryType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Brut</SelectItem>
                  <SelectItem value="net">Net</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDueDays">Jours d&apos;Échéance</Label>
              <Input
                id="invoiceDueDays"
                type="number"
                value={formData.invoiceDueDays}
                onChange={(e) => setFormData({ ...formData, invoiceDueDays: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractVatRate">VAT Rate (%)</Label>
              <Input
                id="contractVatRate"
                type="number"
                step="0.01"
                value={formData.contractVatRate}
                onChange={(e) => setFormData({ ...formData, contractVatRate: e.target.value })}
                placeholder="20.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractReference">Référence Contrat</Label>
              <Input
                id="contractReference"
                value={formData.contractReference}
                onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                placeholder="REF-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencySignDate">Date Signature Agence</Label>
              <Input
                id="agencySignDate"
                type="date"
                value={formData.agencySignDate}
                onChange={(e) => setFormData({ ...formData, agencySignDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorSignDate">Date Signature Contractor</Label>
              <Input
                id="contractorSignDate"
                type="date"
                value={formData.contractorSignDate}
                onChange={(e) => setFormData({ ...formData, contractorSignDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails du contrat..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes supplémentaires..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signedContract">Contrat Signé (PDF)</Label>
            <Input
              id="signedContract"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading || isLoading}
            />
            {formData.signedContractPath && !uploadedFile && (
              <p className="text-sm text-green-600">
                ✓ Un contrat signé existe déjà
              </p>
            )}
            {uploadedFile && (
              <p className="text-sm text-blue-600">
                Fichier sélectionné: {uploadedFile.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Format: PDF uniquement. Taille max: 10 Mo
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || uploading || !formData.agencyId || !formData.contractorId || !formData.payrollPartnerId}
            >
              {(isLoading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Upload en cours..." : contract ? "Mettre à Jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
