"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  ArrowLeft,
  Edit,
  UserPlus,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CompanyModal } from "@/components/modals/company-modal"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function AgencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [contactToRemove, setContactToRemove] = useState<any>(null)

  const { data: company, isLoading, refetch } = api.company.getById.useQuery({ id: companyId })
  const utils = api.useUtils()

  const removeContactMutation = api.company.removeContact.useMutation({
    onSuccess: () => {
      toast.success("Contact removed from company")
      refetch()
      utils.company.getAll.invalidate()
      setContactToRemove(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove contact")
    },
  })

  if (isLoading) {
    return <LoadingPage />
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company Not Found" description="The company you're looking for doesn't exist." />
        <Button onClick={() => router.push("/agencies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agencies
        </Button>
      </div>
    )
  }

  const contacts = company.companyUsers || []

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      case "billing_contact":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      case "billing_contact":
        return "Billing Contact"
      case "contact":
        return "Contact"
      case "member":
        return "Member"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="View and manage company details and contacts"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/agencies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Primary Contact</h4>
                {company.contactPerson && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    {company.contactPerson}
                  </div>
                )}
                {company.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${company.contactEmail}`} className="text-blue-600 hover:underline">
                      {company.contactEmail}
                    </a>
                  </div>
                )}
                {company.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {company.contactPhone}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                {(company.address1 || company.city || company.country) ? (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      {company.officeBuilding && <div>{company.officeBuilding}</div>}
                      {company.address1 && <div>{company.address1}</div>}
                      {company.address2 && <div>{company.address2}</div>}
                      {(company.city || company.state || company.postCode) && (
                        <div>
                          {[company.city, company.state, company.postCode].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {company.country?.name && <div>{company.country.name}</div>}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No address provided</span>
                )}
              </div>
            </div>

            {/* Invoicing Info */}
            {(company.invoicingContactName || company.invoicingContactEmail || company.vatNumber) && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Invoicing Details</h4>
                <div className="grid gap-2 text-sm">
                  {company.invoicingContactName && (
                    <div><span className="text-muted-foreground">Contact:</span> {company.invoicingContactName}</div>
                  )}
                  {company.invoicingContactEmail && (
                    <div><span className="text-muted-foreground">Email:</span> {company.invoicingContactEmail}</div>
                  )}
                  {company.invoicingContactPhone && (
                    <div><span className="text-muted-foreground">Phone:</span> {company.invoicingContactPhone}</div>
                  )}
                  {company.vatNumber && (
                    <div><span className="text-muted-foreground">VAT/EIN:</span> {company.vatNumber}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={company.status === "active" ? "default" : "secondary"}>
                {company.status || "active"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant={company.ownerType === "tenant" ? "default" : "outline"}>
                {company.ownerType === "tenant" ? "Platform Entity" : "Client"}
              </Badge>
            </div>
            {company.bank && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bank</span>
                <span className="text-sm">{company.bank.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts & Team Members
              </CardTitle>
              <CardDescription>
                People associated with this company
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddContactOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add contacts to manage the people associated with this company.
              </p>
              <div className="mt-4">
                <Button onClick={() => setIsAddContactOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Portal Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((cu: any) => (
                  <TableRow key={cu.user?.id}>
                    <TableCell className="font-medium">{cu.user?.name || "Unnamed"}</TableCell>
                    <TableCell>
                      {cu.user?.email ? (
                        <a href={`mailto:${cu.user.email}`} className="text-blue-600 hover:underline">
                          {cu.user.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{cu.user?.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(cu.role)}>
                        {getRoleLabel(cu.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cu.user?.isActive ? "default" : "secondary"}>
                        {cu.user?.isActive ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setContactToRemove(cu)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Company
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Modal */}
      <CompanyModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        company={company}
        onSuccess={() => {
          refetch()
          utils.company.getAll.invalidate()
        }}
      />

      {/* Add Contact Modal */}
      <AddContactModal
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        companyId={companyId}
        companyName={company.name}
        onSuccess={() => {
          refetch()
          utils.company.getAll.invalidate()
        }}
      />

      {/* Remove Contact Confirmation */}
      <DeleteConfirmDialog
        open={!!contactToRemove}
        onOpenChange={(open) => !open && setContactToRemove(null)}
        onConfirm={() => {
          if (contactToRemove) {
            removeContactMutation.mutate({
              companyId,
              userId: contactToRemove.user?.id,
            })
          }
        }}
        title="Remove Contact"
        description={`Are you sure you want to remove "${contactToRemove?.user?.name}" from this company? They will no longer be associated with this company.`}
        isLoading={removeContactMutation.isPending}
      />
    </div>
  )
}
