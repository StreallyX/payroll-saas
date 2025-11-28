"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/shared/file-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Upload, Plus, Trash2 } from "lucide-react"

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function UploadInvoicePage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    notes: "",
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 },
  ])

  const uploadMutation = api.payrollPartner.uploadInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice uploaded successfully!")
      router.push("/payroll-partner")
    },
    onError: (error) => {
      toast.error(`Failed to upload invoice: ${error.message}`)
    },
  })

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map((item) => parseInt(item.id))) + 1).toString()
    setLineItems([
      ...lineItems,
      { id: newId, description: "", quantity: 1, rate: 0, amount: 0 },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          // Auto-calculate amount
          if (field === "quantity" || field === "rate") {
            updated.amount = updated.quantity * updated.rate
          }
          return updated
        }
        return item
      })
    )
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    // Validate line items
    const hasEmptyDescription = lineItems.some((item) => !item.description.trim())
    if (hasEmptyDescription) {
      toast.error("Please fill in all line item descriptions")
      return
    }

    // Convert file to base64
    const reader = new FileReader()
    reader.readAsDataURL(selectedFile)
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1]
      if (!base64) {
        toast.error("Failed to read file")
        return
      }

      try {
        await uploadMutation.mutateAsync({
          periodMonth: formData.periodMonth,
          periodYear: formData.periodYear,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })),
          totalAmount: calculateTotal(),
          notes: formData.notes || undefined,
          file: {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            data: base64,
          },
        })
      } catch (error) {
        // Error handled by mutation
      }
    }
  }

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/payroll-partner")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Upload Invoice"
          description="Upload an invoice to Aspirock"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Billing period and invoice information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Period Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="periodMonth">Month *</Label>
                  <Select
                    value={formData.periodMonth.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, periodMonth: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="periodMonth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodYear">Year *</Label>
                  <Select
                    value={formData.periodYear.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, periodYear: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="periodYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Invoice File (PDF) *</Label>
                <FileUpload
                  accept=".pdf"
                  maxSize={10}
                  onFileSelect={setSelectedFile}
                  label="Upload Invoice"
                  description="PDF format, max 10MB"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>
                    Breakdown of services and costs
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Quantity</TableHead>
                      <TableHead className="w-[20%]">Rate</TableHead>
                      <TableHead className="w-[20%]">Amount</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            placeholder="Service description"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(item.id, "description", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${item.amount.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Optional comments or special instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional notes or comments..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/payroll-partner")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
