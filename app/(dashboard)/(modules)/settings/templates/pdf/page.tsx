"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Edit, Trash2, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface PDFTemplateForm {
  id?: string
  name: string
  displayName: string
  description: string
  type: string
  template: string
  headerHtml: string
  footerHtml: string
  pageSize: string
  orientation: string
}

export default function PDFTemplatesPage() {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplateForm | null>(null)

  const [form, setForm] = useState<PDFTemplateForm>({
    name: "",
    displayName: "",
    description: "",
    type: "contract",
    template: "",
    headerHtml: "",
    footerHtml: "",
    pageSize: "A4",
    orientation: "portrait",
  })

  const { data: templates, refetch, isLoading } = api.tenant.listPDFTemplates.useQuery()

  const createMutation = api.tenant.createPDFTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "PDF template has been created successfully.",
      })
      refetch()
      resetForm()
      setIsModalOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = api.tenant.updatePDFTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "PDF template has been updated successfully.",
      })
      refetch()
      resetForm()
      setIsModalOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template.",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = api.tenant.deletePDFTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "PDF template has been deleted successfully.",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template.",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setForm({
      name: "",
      displayName: "",
      description: "",
      type: "contract",
      template: "",
      headerHtml: "",
      footerHtml: "",
      pageSize: "A4",
      orientation: "portrait",
    })
    setEditingTemplate(null)
  }

  const handleEdit = (template: any) => {
    setForm({
      id: template.id,
      name: template.name,
      displayName: template.displayName,
      description: template.description || "",
      type: template.type,
      template: template.template,
      headerHtml: template.headerHtml || "",
      footerHtml: template.footerHtml || "",
      pageSize: template.pageSize,
      orientation: template.orientation,
    })
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id })
    }
  }

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: form.id!,
        displayName: form.displayName,
        description: form.description,
        template: form.template,
        headerHtml: form.headerHtml,
        footerHtml: form.footerHtml,
        pageSize: form.pageSize,
        orientation: form.orientation,
      })
    } else {
      createMutation.mutate({
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        displayName: form.displayName,
        description: form.description,
        type: form.type,
        template: form.template,
        headerHtml: form.headerHtml,
        footerHtml: form.footerHtml,
        pageSize: form.pageSize,
        orientation: form.orientation,
      })
    }
  }

  const typeColors: Record<string, string> = {
    contract: "bg-blue-100 text-blue-800",
    invoice: "bg-green-100 text-green-800",
    payslip: "bg-purple-100 text-purple-800",
    report: "bg-yellow-100 text-yellow-800",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="PDF Templates"
        description="Manage custom PDF templates for contracts, invoices, and payslips"
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.displayName}</CardTitle>
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  </div>
                  <Badge className={typeColors[template.type] || typeColors.report}>
                    {template.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Page Size</p>
                      <p className="text-gray-600">{template.pageSize}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Orientation</p>
                      <p className="text-gray-600 capitalize">{template.orientation}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Generated: {template.generatedCount} times</span>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex-1"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {!template.isDefault && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && templates?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No PDF templates yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first PDF template to get started.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Create"} PDF Template</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the PDF template details."
                : "Create a new custom PDF template using Handlebars syntax."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingTemplate && (
              <>
                <div className="space-y-2">
                  <Label>Template Name (Internal ID)</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="contract_template_v1"
                  />
                  <p className="text-xs text-gray-500">
                    Internal identifier (use lowercase and underscores)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="contract">Contract</option>
                    <option value="invoice">Invoice</option>
                    <option value="payslip">Payslip</option>
                    <option value="report">Report</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Standard Contract Template"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Template for standard employment contracts..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Size</Label>
                <select
                  value={form.pageSize}
                  onChange={(e) => setForm({ ...form, pageSize: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Orientation</Label>
                <select
                  value={form.orientation}
                  onChange={(e) => setForm({ ...form, orientation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template Content (Handlebars)</Label>
              <Textarea
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                placeholder={`<h1>{{document_title}}</h1>\n<p>Contractor: {{contractor_name}}</p>\n<p>Rate: {{rate}}</p>`}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Use Handlebars syntax like {`{{variable_name}}`} for dynamic content
              </p>
            </div>

            <div className="space-y-2">
              <Label>Header HTML (Optional)</Label>
              <Textarea
                value={form.headerHtml}
                onChange={(e) => setForm({ ...form, headerHtml: e.target.value })}
                placeholder="<div class='header'><img src='{{logo_url}}' /></div>"
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Footer HTML (Optional)</Label>
              <Textarea
                value={form.footerHtml}
                onChange={(e) => setForm({ ...form, footerHtml: e.target.value })}
                placeholder="<div class='footer'>Page {{page}} of {{total_pages}}</div>"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingTemplate ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
