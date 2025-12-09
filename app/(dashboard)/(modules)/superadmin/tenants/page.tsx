"use client"

import { useState, useMemo } from "react"
import { api } from "@/lib/trpc"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { PlusCircle, Search } from "lucide-react"
import { TenantModal } from "@/components/modals/tenant-modal"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export default function SuperAdminTenantsPage() {
  const { data: tenants, isLoading, refetch } = api.tenant.getAllForSuperAdmin.useQuery()
  const updateStatus = api.tenant.updateTenantStatus.useMutation({
    onSuccess: () => {
      toast.success("Tenant status updated")
      refetch()
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  })

  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const filteredTenants = useMemo(() => {
    if (!tenants) return []
    return tenants.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [tenants, search])

  if (isLoading) return <LoadingState message="Loading tenants..." />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenant Management"
        description="Create and manage organizations across the platform"
      />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tenant..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create New Tenant
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3">Tenant Name</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-center">Users</th>
              <th className="px-4 py-3 text-center">Contracts</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No tenants found.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {tenant.userCount}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {tenant.contractCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                        className={`capitalize ${
                            tenant.isActive
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                        >
                        {tenant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={tenant.isActive}
                        onCheckedChange={(checked) =>
                          updateStatus.mutate({ tenantId: tenant.id, isActive: checked })
                        }
                        disabled={updateStatus.isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <TenantModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => refetch()}
      />
    </div>
  )
}
