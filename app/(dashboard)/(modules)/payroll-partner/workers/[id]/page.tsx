"use client"

import { use } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { api } from "@/lib/trpc"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface WorkerDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function WorkerDetailsPage({ params }: WorkerDetailsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const workerId = resolvedParams.id

  const { data: worker, isLoading } = api.payrollPartner.getWorkerById.useQuery({ id: workerId })
  const { data: onboardingStatus } = api.payrollPartner.getWorkerOnboardingStatus.useQuery({ workerId })
  const { data: payslips } = api.payslip.list.useQuery({
    userId: workerId,
    limit: 10,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Worker not found</h3>
          <p className="text-sm text-muted-foreground">The worker you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.push("/payroll-partner/workers")}>
            Back to Workers
          </Button>
        </div>
      </div>
    )
  }

  const onboardingProgress = onboardingStatus
    ? (onboardingStatus.completedSteps / onboardingStatus.totalSteps) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/payroll-partner/workers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`${worker.firstName} ${worker.lastName}`}
            description={worker.email}
          />
        </div>
        <StatusBadge status={worker.status || "pending"} />
      </div>

      {/* Personal Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{worker.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{worker.phoneNumber || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Country</p>
                <p className="text-sm text-muted-foreground">{worker.countryCode || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {worker.createdAt ? format(new Date(worker.createdAt), "MMMM dd, yyyy") : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Status */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Status</CardTitle>
            <CardDescription>Progress through onboarding steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{Math.round(onboardingProgress)}%</span>
              </div>
              <Progress value={onboardingProgress} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Documents</span>
                <StatusBadge
                  status={onboardingStatus?.documentsComplete ? "completed" : "pending"}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Bank Account</span>
                <StatusBadge
                  status={onboardingStatus?.bankAccountComplete ? "completed" : "pending"}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>LEA Contract</span>
                <StatusBadge
                  status={onboardingStatus?.contractSigned ? "completed" : "pending"}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Contract (LEA) */}
      <Card>
        <CardHeader>
          <CardTitle>Local Employment Agreement (LEA)</CardTitle>
          <CardDescription>Employment contract details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Salary Type</p>
              <p className="text-sm text-muted-foreground capitalize">
                {worker.salaryType || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-muted-foreground">
                {worker.contractStartDate
                  ? format(new Date(worker.contractStartDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-muted-foreground">
                {worker.contractEndDate
                  ? format(new Date(worker.contractEndDate), "MMM dd, yyyy")
                  : "Ongoing"}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push(`/contracts?workerId=${workerId}`)}>
              <FileText className="mr-2 h-4 w-4" />
              View LEA Contract
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payslips History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payslips History</CardTitle>
              <CardDescription>Recent payslips uploaded</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/payroll-partner/payslips/upload?workerId=${workerId}`)}
            >
              Upload Payslip
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!payslips || payslips.payslips.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No payslips available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {payslip.periodMonth}/{payslip.periodYear}
                    </TableCell>
                    <TableCell>${payslip.grossAmount?.toLocaleString() || "N/A"}</TableCell>
                    <TableCell>${payslip.netAmount?.toLocaleString() || "N/A"}</TableCell>
                    <TableCell>
                      <StatusBadge status={payslip.status || "pending"} />
                    </TableCell>
                    <TableCell>
                      {payslip.uploadedAt
                        ? format(new Date(payslip.uploadedAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Uploaded contracts and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push(`/documents?entityId=${workerId}`)}>
            <FileText className="mr-2 h-4 w-4" />
            View All Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
