"use client"

import { useState, useMemo } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// ---------------------------------------------------------
// Helper: Trouver le participant principal du contrat
// ---------------------------------------------------------
function getMainParticipant(contract: any) {
  return (
    contract?.participants?.find((p: any) => p.isPrimary) ||
    contract?.participants?.find((p: any) => p.role === "contractor") ||
    null
  )
}

type InvoiceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice?: any
  onSuccess?: () => void
}

export function InvoiceModal({
  open,
  onOpenChange,
  onSuccess
}: InvoiceModalProps) {
  const [contractId, setContractId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [days, setDays] = useState(1)
  const [expenses, setExpenses] = useState("0")
  const [notes, setNotes] = useState("")
  const [sendCopy, setSendCopy] = useState(false)

  const utils = api.useUtils()

  // Fetch the user's active contracts
  const { data: contracts = [], isLoading: contractsLoading } =
    api.contract.getMyContracts.useQuery()

  const selectedContract = useMemo(() => {
    return contracts.find((c: any) => c.id === contractId)
  }, [contractId, contracts])

  const mainParticipant = useMemo(() => {
    return getMainParticipant(selectedContract)
  }, [selectedContract])

  // Auto calc: consulting amount = days × rate
  const consultingAmount = useMemo(() => {
    if (!selectedContract) return 0
    return Number(days) * Number(selectedContract.rate ?? 0)
  }, [days, selectedContract])

  const totalAmount = useMemo(() => {
    return consultingAmount + Number(expenses || 0)
  }, [consultingAmount, expenses])

  const createMutation = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully")
      utils.invoice.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (err: any) => toast.error(err.message)
  })

  // ---------------------------------------------------------
  // SUBMIT NEW INVOICE
  // ---------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!contractId) return toast.error("Contract is required")
    if (!fromDate || !toDate) return toast.error("Billing period required")

    if (!selectedContract) return toast.error("Selected contract not found")

    const consulting = Number(days) * Number(selectedContract.rate ?? 0)
    const expensesValue = Number(expenses || 0)
    const total = consulting + expensesValue

    const payload = {
      contractId: contractId || undefined,

      status: "draft",

      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),

      currency: "EUR",
      taxAmount: 0,
      amount: total,
      totalAmount: total,

      description: notes || undefined,
      notes: sendCopy ? "Send copy to accounts" : undefined,

      lineItems: [
        {
          description: "Consulting Services",
          quantity: days,
          unitPrice: Number(selectedContract.rate ?? 0),
          amount: consulting,
        },
        ...(expensesValue > 0
          ? [
              {
                description: "Expenses",
                quantity: 1,
                unitPrice: Number(expensesValue),
                amount: expensesValue,
              }
            ]
          : []),
      ]
    }

    createMutation.mutate(payload)
  }

  const isSaving = createMutation.isPending

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Fill the billing period and details. Totals are calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CONTRACT SELECTION */}
          <div className="space-y-2">
            <Label>Contract *</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>

              <SelectContent>
                {contractsLoading && (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}

                {contracts.length === 0 && (
                  <SelectItem value="none" disabled>No contracts</SelectItem>
                )}

                {contracts.map((c: any) => {
                  const main = getMainParticipant(c)
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {main?.user?.name || "Unknown"} ({c.company?.name})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* CONTRACT DETAILS */}
          {selectedContract && (
            <div className="border p-4 rounded-lg space-y-1 text-sm">

              <p><b>Contract No:</b> {selectedContract.contractReference}</p>

              {selectedContract.rate && (
                <p><b>Rate:</b> {String(selectedContract.rate)} EUR / Daily</p>
              )}

              <p><b>Agency/Client:</b> {selectedContract.company?.name}</p>

              <p><b>Worker:</b> {mainParticipant?.user?.name || "Unknown"}</p>

              {selectedContract.startDate && (
                <p><b>Start:</b> {new Date(selectedContract.startDate).toLocaleDateString()}</p>
              )}

              {selectedContract.endDate && (
                <p><b>End:</b> {new Date(selectedContract.endDate).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {/* BILLING PERIOD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Billing From *</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label>Billing To *</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          {/* NUMBER OF DAYS */}
          <div>
            <Label>Number of Days *</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>

          {/* CONSULTING */}
          <div className="border p-4 rounded-lg bg-muted/20">
            <p className="font-medium">Consulting Services</p>
            <p>{consultingAmount.toFixed(2)} EUR</p>
          </div>

          {/* EXPENSES */}
          <div>
            <Label>Any Expenses (EUR)</Label>
            <Input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
            />
          </div>

          {/* NOTES */}
          <div>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write description"
            />
          </div>

          {/* TOTAL */}
          <div className="border p-4 rounded-lg bg-muted/30 text-lg font-bold">
            Total Invoice Amount: {totalAmount.toFixed(2)} EUR
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
