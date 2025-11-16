"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, ClipboardList, Edit, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OnboardingTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Note: Using existing onboarding router
  const { data: templates, isLoading } = api.onboarding.getAllTemplates.useQuery()

  if (isLoading) return <LoadingState message="Loading onboarding templates..." />

  const templatesList = templates || []
  const filteredTemplates = templatesList.filter((t: any) =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding Templates" description="Manage onboarding workflows and questions for contractors">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{templatesList.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{templatesList.filter((t: any) => t.isActive).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{templatesList.reduce((acc: number, t: any) => acc + (t.questions?.length || 0), 0)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredTemplates.length === 0 ? (
            <>
              <EmptyState
                title="No onboarding templates"
                description="Create your first onboarding template"
                icon={ClipboardList}
                onAction={() => {}}
              />
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> New Template
              </Button>
            </>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell><p className="font-medium">{template.name}</p></TableCell>
                    <TableCell><Badge variant="outline">{template.questions?.length || 0} questions</Badge></TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{template.usageCount || 0} times used</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost"><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
