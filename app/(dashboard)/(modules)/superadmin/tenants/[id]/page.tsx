
"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Settings,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = use(params)
  const router = useRouter()

  const { data: tenants, isLoading } = api.tenant.getAllForSuperAdmin.useQuery()
  const updateStatus = api.tenant.updateTenantStatus.useMutation({
    onSuccess: () => {
      toast.success("Tenant status updated successfully")
      window.location.reload()
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  })

  const deleteTenant = api.tenant.deleteTenant.useMutation({
    onSuccess: () => {
      toast.success("Tenant deleted successfully")
      router.push("/superadmin/tenants")
    },
    onError: (err) => toast.error(err.message || "Failed to delete tenant"),
  })

  if (isLoading) return <LoadingState message="Loading tenant details..." />

  const tenant = tenants?.find((t) => t.id === tenantId)

  if (!tenant) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Tenant Not Found"
          description="The requested tenant could not be found"
        />
        <Button onClick={() => router.push("/superadmin/tenants")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
      </div>
    )
  }

  const handleToggleStatus = () => {
    updateStatus.mutate({ tenantId: tenant.id, isActive: !tenant.isActive })
  }

  const handleDeleteTenant = () => {
    if (confirm(`Are you sure you want to delete tenant "${tenant.name}"? This action cannot be undone.`)) {
      deleteTenant.mutate({ tenantId: tenant.id })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/superadmin/tenants")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <PageHeader
              title={tenant.name}
              description={`Tenant ID: ${tenant.id}`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge
            className={`capitalize ${
              tenant.isActive
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {tenant.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{tenant.userCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{tenant.contractCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{tenant.invoiceCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Created On</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(tenant.createdAt), "dd MMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Tenant Actions
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h4 className="font-medium text-gray-900">Toggle Status</h4>
              <p className="text-sm text-gray-500">
                {tenant.isActive ? "Deactivate" : "Activate"} this tenant
              </p>
            </div>
            <Button
              onClick={handleToggleStatus}
              disabled={updateStatus.isPending}
              variant={tenant.isActive ? "destructive" : "default"}
            >
              {tenant.isActive ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h4 className="font-medium text-gray-900">View Analytics</h4>
              <p className="text-sm text-gray-500">View detailed analytics for this tenant</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/analytics?tenantId=${tenant.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete Tenant</h4>
              <p className="text-sm text-gray-500">
                Permanently delete this tenant and all associated data
              </p>
            </div>
            <Button
              onClick={handleDeleteTenant}
              disabled={deleteTenant.isPending}
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete Tenant
            </Button>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Tenant Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Tenant ID</p>
            <p className="font-medium text-gray-900">{tenant.id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{tenant.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium text-gray-900">
              {format(new Date(tenant.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge
              className={`${
                tenant.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {tenant.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
