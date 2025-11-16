"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  User, 
  FileText, 
  Calendar, 
  DollarSign, 
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from "lucide-react"
import { api } from "@/lib/trpc"
import { LoadingState } from "@/components/shared/loading-state"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { downloadFile } from "@/lib/s3"

interface ContractViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string | null
}

export function ContractViewModal({ open, onOpenChange, contractId }: ContractViewModalProps) {
  const { data: contract, isLoading } = api.contract.getById.useQuery(
    { id: contractId || "" },
    { enabled: open && Boolean(contractId) }
  )

  const handleViewDocument = async () => {
    if (contract?.signedContractPath) {
      try {
        const signedUrl = await downloadFile(contract.signedContractPath)
        window.open(signedUrl, '_blank')
      } catch (error: any) {
        toast.error("Error opening document: " + error.message)
      }
    } else {
      toast.error("No signed contract available")
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      paused: "bg-yellow-100 text-yellow-800",
      terminated: "bg-red-100 text-red-800",
    }
    return statusColors[status] || "bg-gray-100 text-gray-800"
  }

  const getWorkflowStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending_agency_sign: "bg-yellow-100 text-yellow-800",
      pending_contractor_sign: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-orange-100 text-orange-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      terminated: "bg-red-100 text-red-800",
    }
    return statusColors[status] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: any, currencySymbol?: string) => {
    if (!amount) return "-"
    const symbol = currencySymbol || "$"
    return `${symbol}${parseFloat(amount.toString()).toFixed(2)}`
  }

  const calculateDuration = () => {
    if (!contract?.startDate || !contract?.endDate) return "-"
    const start = new Date(contract.startDate)
    const end = new Date(contract.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const months = Math.floor(diffDays / 30)
    const days = diffDays % 30
    return months > 0 ? `${months} month${months > 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}` : `${days} day${days !== 1 ? 's' : ''}`
  }

  if (!contractId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {contract?.title || `Contract #${contractId.slice(0, 8)}`}
              </DialogTitle>
              {contract?.contractReference && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: {contract.contractReference}
                </p>
              )}
            </div>
            {contract?.signedContractPath && (
              <Button onClick={handleViewDocument} size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Loading contract details..." />
        ) : contract ? (
          <div className="space-y-6">
            {/* Status Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Workflow Status</p>
                    <Badge className={getWorkflowStatusColor(contract.workflowStatus)}>
                      {contract.workflowStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Duration</p>
                    <p className="font-medium">{calculateDuration()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Invoices</p>
                    <p className="font-medium">{contract.invoices?.length || 0} invoice{contract.invoices?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parties Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Agency/Client */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Agency/Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold">{contract.agency?.name || "-"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{contract.agency?.contactEmail || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{contract.agency?.contactPhone || "-"}</p>
                  </div>
                  {contract.agencySignDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Signed On</p>
                      <p className="text-sm flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {formatDate(contract.agencySignDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contractor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    Contractor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {contract.contractor?.user?.name || contract.contractor?.name || "-"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{contract.contractor?.user?.email || contract.contractor?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{contract.contractor?.phone || "-"}</p>
                  </div>
                  {contract.contractorSignDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Signed On</p>
                      <p className="text-sm flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {formatDate(contract.contractorSignDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payroll Partner */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                    Payroll Partner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold">{contract.payrollPartner?.name || "-"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{contract.payrollPartner?.contactEmail || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{contract.payrollPartner?.contactPhone || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rate</p>
                    <p className="text-lg font-semibold">
                      {contract.rate ? formatCurrency(contract.rate, contract.currency?.symbol) : "-"}
                    </p>
                    {contract.rateType && (
                      <p className="text-xs text-muted-foreground">per {contract.rateType}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Currency</p>
                    <p className="text-lg font-semibold">
                      {contract.currency?.code || "-"}
                    </p>
                    {contract.currency?.name && (
                      <p className="text-xs text-muted-foreground">{contract.currency.name}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Margin</p>
                    <p className="text-lg font-semibold">
                      {contract.margin ? (
                        contract.marginType === 'percentage' 
                          ? `${contract.margin}%`
                          : formatCurrency(contract.margin, contract.currency?.symbol)
                      ) : "-"}
                    </p>
                    {contract.marginPaidBy && (
                      <p className="text-xs text-muted-foreground">Paid by {contract.marginPaidBy}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Salary Type</p>
                    <p className="text-lg font-semibold capitalize">
                      {contract.salaryType || "-"}
                    </p>
                  </div>

                  {contract.contractVatRate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">VAT Rate</p>
                      <p className="text-lg font-semibold">
                        {contract.contractVatRate}%
                      </p>
                    </div>
                  )}

                  {contract.invoiceDueDays && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Invoice Due Days</p>
                      <p className="text-lg font-semibold">
                        {contract.invoiceDueDays} days
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                    <p className="text-base font-medium">{formatDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">End Date</p>
                    <p className="text-base font-medium">{formatDate(contract.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <p className="text-base font-medium">{formatDate(contract.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Notes */}
            {(contract.description || contract.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{contract.description}</p>
                    </div>
                  )}
                  {contract.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Termination Information */}
            {contract.terminationReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    Termination Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Reason:</p>
                    <p className="text-sm text-red-900">{contract.terminationReason}</p>
                  </div>
                  {contract.terminatedAt && (
                    <div>
                      <p className="text-sm text-red-700 font-medium">Terminated On:</p>
                      <p className="text-sm text-red-900">{formatDate(contract.terminatedAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Contract not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
