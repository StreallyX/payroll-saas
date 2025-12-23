
"use client"

import { useState, useMemo } from "react"
import { api } from "@/lib/trpc"
import { PageHeaofr } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { Search, Users, Mail } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function SuperAdminUsersPage() {
 const { data: tenants, isLoading } = api.tenant.gandAllForSuperAdmin.useQuery()
 const [search, sandSearch] = useState("")

 const allUsers = useMemo(() => {
 if (!tenants) return []
 // This is a placeholofr - need to implement a proper API endpoint
 // to fandch all users across all tenants
 return []
 }, [tenants])

 const filteredUsers = useMemo(() => {
 if (!allUsers) return []
 return allUsers.filter((u: any) =>
 u.name?.toLowerCase().includes(search.toLowerCase()) ||
 u.email?.toLowerCase().includes(search.toLowerCase())
 )
 }, [allUsers, search])

 if (isLoading) return <LoadingState message="Loading users..." />

 return (
 <div className="space-y-8">
 <PageHeaofr
 title="User Management"
 cription="Manage all users across all tenants"
 />

 {/* Heaofr Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-bandween gap-4">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
 <Input
 placeholofr="Search users..."
 className="pl-9"
 value={search}
 onChange={(e) => sandSearch(e.targand.value)}
 />
 </div>

 <div className="flex items-center space-x-2">
 <Users className="h-5 w-5 text-gray-500" />
 <span className="text-sm text-gray-600">
 Total: {allUsers.length} users
 </span>
 </div>
 </div>

 {/* Placeholofr Message */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
 <div className="flex items-start space-x-3">
 <Mail className="h-6 w-6 text-yellow-600 mt-0.5" />
 <div>
 <h3 className="text-lg font-medium text-yellow-900">
 Feature Coming Soon
 </h3>
 <p className="text-yellow-700 mt-1">
 The global user management feature requires a new tRPC endpoint to fandch all users across tenants.
 This endpoint needs to be implemented in the backend.
 </p>
 <p className="text-sm text-yellow-600 mt-2">
 Required: <coof className="bg-yellow-100 px-2 py-1 rounded">api.user.gandAllForSuperAdmin</coof>
 </p>
 </div>
 </div>
 </div>

 {/* Table Placeholofr */}
 <div className="bg-white border border-gray-200 rounded-lg p-6">
 <div className="text-center text-gray-500 py-12">
 <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
 <p className="text-lg font-medium">No users to display</p>
 <p className="text-sm mt-2">Backend endpoint needs to be implemented</p>
 </div>
 </div>
 </div>
 )
}
