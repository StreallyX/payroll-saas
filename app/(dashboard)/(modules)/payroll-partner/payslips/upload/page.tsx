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
import { api } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Upload } from "lucide-react"

export default function UploadPayslipPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    workerId: "",
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    grossAmount: "",
    netAmount: "",
    notes: "",
  })

  const { data: workers } = api.payrollPartner.listWorkers.useQuery({
    status: "active",
    limit: 100,
  })

  const uploadMutation = api.payrollPartner.uploadPayslip.useMutation({
    onSuccess: () => {
      toast.success("Payslip uploaded successfully!")
      router.push("/payroll-partner")
    },
    onError: (error) => {
      toast.error(`Failed to upload payslip: ${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    if (!formData.workerId) {
      toast.error("Please select a worker")
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
          workerId: formData.workerId,
          periodMonth: formData.periodMonth,
          periodYear: formData.periodYear,
          grossAmount: parseFloat(formData.grossAmount) || undefined,
          netAmount: parseFloat(formData.netAmount) || undefined,
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
          title="Upload Payslip"
          description="Upload a payslip for a worker"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payslip Details</CardTitle>
            <CardDescription>
              Select the worker and period for this payslip
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Worker Selection */}
            <div className="space-y-2">
              <Label htmlFor="workerId">Worker *</Label>
              <Select
                value={formData.workerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, workerId: value })
                }
              >
                <SelectTrigger id="workerId">
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers?.workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName} - {worker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Amounts */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grossAmount">Gross Amount</Label>
                <Input
                  id="grossAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.grossAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, grossAmount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netAmount">Net Amount</Label>
                <Input
                  id="netAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.netAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, netAmount: e.target.value })
                  }
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Payslip File (PDF) *</Label>
              <FileUpload
                accept=".pdf"
                maxSize={10}
                onFileSelect={setSelectedFile}
                label="Upload Payslip"
                description="PDF format, max 10MB"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

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
                    Upload Payslip
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
