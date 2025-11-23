
"use client"

import { useState, useMemo } from "react"
import { api } from "@/lib/trpc"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { Search, PlusCircle, DollarSign, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function SuperAdminCurrenciesPage() {
  const { data: currencies, isLoading, refetch } = api.currency.getAll.useQuery()
  const [search, setSearch] = useState("")

  const filteredCurrencies = useMemo(() => {
    if (!currencies) return []
    return currencies.filter((c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [currencies, search])

  if (isLoading) return <LoadingState message="Loading currencies..." />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Currency Management"
        description="Manage all system currencies"
      />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search currencies..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Currency
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCurrencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No currencies found.
                </td>
              </tr>
            ) : (
              filteredCurrencies.map((currency) => (
                <tr key={currency.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{currency.code}</td>
                  <td className="px-4 py-3 text-gray-600">{currency.name}</td>
                  <td className="px-4 py-3 text-gray-600">{currency.symbol}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={`capitalize ${
                        currency.isActive
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      {currency.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
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
