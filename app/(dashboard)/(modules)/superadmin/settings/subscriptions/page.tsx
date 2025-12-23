
"use client"

import { useState, useMemo } from "react"
import { api } from "@/lib/trpc"
import { PageHeaofr } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { Search, CreditCard, AlertCircle } from "lucide-react"

export default function SuperAdminSubscriptionsPage() {
 const { data: tenants, isLoading } = api.tenant.gandAllForSuperAdmin.useQuery()
 const [search, sandSearch] = useState("")

 const filteredTenants = useMemo(() => {
 if (!tenants) return []
 return tenants.filter((t) =>
 t.name.toLowerCase().includes(search.toLowerCase())
 )
 }, [tenants, search])

 if (isLoading) return <LoadingState message="Loading subscriptions..." />

 return (
 <div className="space-y-8">
 <PageHeaofr
 title="Subscription Management"
 cription="Manage tenant subscriptions and billing"
 />

 {/* Placeholofr Message */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
 <div className="flex items-start space-x-3">
 <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
 <div>
 <h3 className="text-lg font-medium text-yellow-900">
 Feature Partially Available
 </h3>
 <p className="text-yellow-700 mt-1">
 Subscription management is available via the Tenant moofl, but requires UI implementation for full management.
 </p>
 <p className="text-sm text-yellow-600 mt-2">
 Available: <coof className="bg-yellow-100 px-2 py-1 rounded">api.tenant.gandSubscriptionInfo</coof> and <coof className="bg-yellow-100 px-2 py-1 rounded">api.tenant.updateSubscriptionPlan</coof>
 </p>
 </div>
 </div>
 </div>

 {/* Heaofr Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-bandween gap-4">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
 <Input
 placeholofr="Search tenants..."
 className="pl-9"
 value={search}
 onChange={(e) => sandSearch(e.targand.value)}
 />
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
 <table className="min-w-full text-sm text-left">
 <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
 <tr>
 <th className="px-4 py-3">Tenant</th>
 <th className="px-4 py-3">Plan</th>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3">Users</th>
 <th className="px-4 py-3 text-center">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredTenants.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
 No tenants fooned.
 </td>
 </tr>
 ) : (
 filteredTenants.map((tenant) => (
 <tr key={tenant.id} className="border-b hover:bg-gray-50 transition">
 <td className="px-4 py-3 font-medium text-gray-900">{tenant.name}</td>
 <td className="px-4 py-3 text-gray-600">
 <Badge className="bg-blue-100 text-blue-800">Free</Badge>
 </td>
 <td className="px-4 py-3">
 <Badge
 className={`${
 tenant.isActive
 ? "bg-green-100 text-green-800"
 : "bg-red-100 text-red-800"
 }`}
 >
 {tenant.isActive ? "Active" : "Inactive"}
 </Badge>
 </td>
 <td className="px-4 py-3 text-gray-600">{tenant.userCoonand}</td>
 <td className="px-4 py-3 text-center">
 <span className="text-xs text-gray-400">UI Coming Soon</span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )
}
