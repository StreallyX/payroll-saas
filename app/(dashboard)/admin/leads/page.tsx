
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Phone, Mail, Plus, Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeadModal } from "@/components/modals/lead-modal"
import { api } from "@/lib/trpc"
import { toast } from "sonner"

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data: leadsData, isLoading, refetch } = api.lead.getAll.useQuery()
  const { data: leadStats } = api.lead.getStats.useQuery()
  
  const exportMutation = api.lead.export.useMutation({
    onSuccess: () => {
      toast.success("Leads exported successfully!")
    },
    onError: () => {
      toast.error("Failed to export leads")
    }
  })

  const leads = leadsData || []

  const stats = [
    { label: "Total Leads", value: leadStats?.total?.toString() || "0", change: "", icon: TrendingUp },
    { label: "Hot Leads", value: leadStats?.hot?.toString() || "0", change: "", icon: TrendingUp },
    { label: "Warm Leads", value: leadStats?.warm?.toString() || "0", change: "", icon: TrendingUp },
    { label: "Cold Leads", value: leadStats?.cold?.toString() || "0", change: "", icon: TrendingUp }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot": return "bg-red-100 text-red-700 border-red-200"
      case "warm": return "bg-orange-100 text-orange-700 border-orange-200"
      case "cold": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = lead?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                         lead?.contact?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                         lead?.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead?.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Manage and track your sales leads"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </PageHeader>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">
                  {stat.change} this month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No leads found</p>
            <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLeads.map((lead: any) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{lead.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {lead.contact}
                    </p>
                  </div>
                  <Badge className={getStatusColor(lead.status)} variant="outline">
                    {lead.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{lead.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                  {lead.value && (
                    <div>
                      <p className="text-gray-600">Est. Value</p>
                      <p className="font-semibold text-lg">{lead.value}</p>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <p className="text-gray-600">Source</p>
                      <p className="font-medium">{lead.source}</p>
                    </div>
                  )}
                  {lead.lastContact && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Last Contact</p>
                      <p className="font-medium">{new Date(lead.lastContact).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {lead.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm">{lead.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      <LeadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          refetch()
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
