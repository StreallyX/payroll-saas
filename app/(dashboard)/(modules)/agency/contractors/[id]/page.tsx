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

interface ContractorDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function ContractorDetailsPage({ params }: ContractorDetailsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const contractorId = resolvedParams.id

  const { data: contractor, isLoading } = api.contractor.getById.useQuery({ id: contractorId })
  const { data: onboardingStatus } = api.contractor.getOnboardingStatus.useQuery({ contractorId })
  const { data: paymentHistory } = api.payment.list.useQuery({
    userId: contractorId,
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

  if (!contractor) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Contractor not found</h3>
          <p className="text-sm text-muted-foreground">The contractor you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.push("/agency/contractors")}>
            Back to Contractors
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
          onClick={() => router.push("/agency/contractors")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`${contractor.firstName} ${contractor.lastName}`}
            description={contractor.email}
          />
        </div>
        <StatusBadge status={contractor.status || "pending"} />
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
                <p className="text-sm text-muted-foreground">{contractor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{contractor.phoneNumber || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Country</p>
                <p className="text-sm text-muted-foreground">{contractor.countryCode || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {contractor.createdAt ? format(new Date(contractor.createdAt), "MMMM dd, yyyy") : "N/A"}
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
                <span>Contract</span>
                <StatusBadge
                  status={onboardingStatus?.contractSigned ? "completed" : "pending"}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>Current contract details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Contract Type</p>
              <p className="text-sm text-muted-foreground">{contractor.contractType || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-muted-foreground">
                {contractor.contractStartDate
                  ? format(new Date(contractor.contractStartDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-muted-foreground">
                {contractor.contractEndDate
                  ? format(new Date(contractor.contractEndDate), "MMM dd, yyyy")
                  : "Ongoing"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {!paymentHistory || paymentHistory.payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No payment history available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paymentDate
                        ? format(new Date(payment.paymentDate), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>${payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>{payment.method || "N/A"}</TableCell>
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
          <Button variant="outline" onClick={() => router.push(`/documents?entityId=${contractorId}`)}>
            <FileText className="mr-2 h-4 w-4" />
            View All Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
