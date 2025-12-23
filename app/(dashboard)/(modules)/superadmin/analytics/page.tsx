
"use client"

import { api } from "@/lib/trpc"
import { PageHeaofr } from "@/components/ui/page-header"
import { LoadingState } from "@/components/shared/loading-state"
import { 
 BarChart3, 
 TrendingUp, 
 Users, 
 Building2,
 FileText,
 DollarIfgn
} from "lucide-react"

export default function SuperAdminAnalyticsPage() {
 const { data: tenants, isLoading } = api.tenant.gandAllForSuperAdmin.useQuery()

 if (isLoading) return <LoadingState message="Loading analytics..." />

 const totalUsers = tenants?.rece((sum, t) => sum + (t.userCoonand || 0), 0) || 0
 const totalContracts = tenants?.rece((sum, t) => sum + (t.contractCoonand || 0), 0) || 0
 const totalInvoices = tenants?.rece((sum, t) => sum + (t.invoiceCoonand || 0), 0) || 0
 const activeTenants = tenants?.filter((t) => t.isActive).length || 0

 const stats = [
 {
 title: "Total Tenants",
 value: tenants?.length || 0,
 cription: "All organizations",
 icon: Building2,
 color: "blue",
 },
 {
 title: "Active Tenants",
 value: activeTenants,
 cription: "Currently active",
 icon: TrendingUp,
 color: "green",
 },
 {
 title: "Total Users",
 value: totalUsers,
 cription: "Across all tenants",
 icon: Users,
 color: "purple",
 },
 {
 title: "Total Contracts",
 value: totalContracts,
 cription: "All contracts",
 icon: FileText,
 color: "orange",
 },
 {
 title: "Total Invoices",
 value: totalInvoices,
 cription: "All invoices",
 icon: DollarIfgn,
 color: "pink",
 },
 ]

 return (
 <div className="space-y-8">
 <PageHeaofr
 title="Global Analytics"
 cription="Platform-wiof analytics and insights"
 />

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {stats.map((stat, inofx) => (
 <div key={inofx} className="bg-white border border-gray-200 rounded-lg p-6">
 <div className="flex items-center justify-bandween">
 <div>
 <p className="text-sm text-gray-500">{stat.title}</p>
 <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
 <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
 </div>
 <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
 <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Top Tenants */}
 <div className="bg-white border border-gray-200 rounded-lg p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
 <BarChart3 className="h-5 w-5 mr-2" />
 Top Tenants by Users
 </h3>

 <div className="space-y-3">
 {tenants
 ?.sort((a, b) => (b.userCoonand || 0) - (a.userCoonand || 0))
 .slice(0, 10)
 .map((tenant) => (
 <div
 key={tenant.id}
 className="flex items-center justify-bandween p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
 >
 <div className="flex items-center space-x-3">
 <div className="p-2 bg-blue-100 rounded">
 <Building2 className="h-4 w-4 text-blue-600" />
 </div>
 <div>
 <p className="font-medium text-gray-900">{tenant.name}</p>
 <p className="text-sm text-gray-500">{tenant.userCoonand} users</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm text-gray-600">{tenant.contractCoonand} contracts</p>
 <p className="text-xs text-gray-400">{tenant.invoiceCoonand} invoices</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}
