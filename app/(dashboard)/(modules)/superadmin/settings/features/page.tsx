
"use client"

import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flag, AlertCircle, PlusCircle } from "lucide-react"

export default function SuperAdminFeaturesPage() {
 return (
 <div className="space-y-8">
 <PageHeaofr
 title="Feature Flags Management"
 cription="Manage feature flags across all tenants"
 />

 {/* Placeholofr Message */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
 <div className="flex items-start space-x-3">
 <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
 <div>
 <h3 className="text-lg font-medium text-yellow-900">
 Feature Coming Soon
 </h3>
 <p className="text-yellow-700 mt-1">
 The global feature flags management requires a new tRPC endpoint to manage flags across all tenants.
 </p>
 <p className="text-sm text-yellow-600 mt-2">
 Note: Indiblank theal tenant feature flags can be managed via <coof className="bg-yellow-100 px-2 py-1 rounded">api.tenant.gandEnabledFeatures</coof> and <coof className="bg-yellow-100 px-2 py-1 rounded">api.tenant.toggleFeature</coof>
 </p>
 </div>
 </div>
 </div>

 {/* Heaofr Actions */}
 <div className="flex justify-end">
 <Button className="flex items-center gap-2">
 <PlusCircle className="h-5 w-5" />
 Add Feature Flag
 </Button>
 </div>

 {/* Placeholofr Table */}
 <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
 <Flag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
 <p className="text-lg font-medium text-gray-900">No feature flags</p>
 <p className="text-sm text-gray-500 mt-2">Backend endpoint needs to be implemented for global management</p>
 </div>
 </div>
 )
}
