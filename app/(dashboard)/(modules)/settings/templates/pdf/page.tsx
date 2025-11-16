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
import { Plus, Search, FileText, Edit, Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PDFTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateToDelete, setTemplateToDelete] = useState<any>(null)
  
  const [formData, setFormData] = useState<{
    key: string
    name: string
    htmlTemplate: string
    cssTemplate: string
    description: string
    isActive: boolean
    pageSize: "A4" | "LETTER" | "LEGAL"
    orientation: "portrait" | "landscape"
  }>({
    key: "",
    name: "",
    htmlTemplate: "",
    cssTemplate: "",
    description: "",
    isActive: true,
    pageSize: "A4",
    orientation: "portrait",
  })


  const utils = api.useUtils()
  const { data: templatesData, isLoading } = api.pdfTemplate.getAll.useQuery()
  const { data: variablesData } = api.pdfTemplate.getVariables.useQuery()

  const createMutation = api.pdfTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("PDF template created successfully!")
      utils.pdfTemplate.getAll.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
  })

  const updateMutation = api.pdfTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("PDF template updated successfully!")
      utils.pdfTemplate.getAll.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
  })

  const deleteMutation = api.pdfTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("PDF template deleted successfully!")
      utils.pdfTemplate.getAll.invalidate()
      setTemplateToDelete(null)
    },
  })

  const duplicateMutation = api.pdfTemplate.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated successfully!")
      utils.pdfTemplate.getAll.invalidate()
    },
  })

  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      htmlTemplate: "",
      cssTemplate: "",
      description: "",
      isActive: true,
      pageSize: "A4",
      orientation: "portrait",
    })
    setSelectedTemplate(null)
  }

  const handleSubmit = () => {
    if (selectedTemplate) {
      updateMutation.mutate({
        id: selectedTemplate.id,

        displayName: formData.name,
        type: "contract",     // tu peux adapter selon ton usage

        template: formData.htmlTemplate,
        headerHtml: "",
        footerHtml: "",

        styles: { css: formData.cssTemplate },
        margins: { top: "20mm", bottom: "20mm" },

        description: formData.description,
        pageSize: formData.pageSize,
        orientation: formData.orientation,

        isActive: formData.isActive,
      })
    } else {
      createMutation.mutate({
        name: formData.key,                // clé technique
        displayName: formData.name,        // nom visible
        type: "contract",                  // ou "invoice", "report", etc.

        template: formData.htmlTemplate,   // HTML principal
        headerHtml: "",                    // optionnel
        footerHtml: "",                    // optionnel

        styles: { css: formData.cssTemplate }, // stocke ton CSS
        margins: { top: "20mm", bottom: "20mm" },

        description: formData.description,

        pageSize: formData.pageSize,
        orientation: formData.orientation,

        watermarkText: undefined,
        watermarkOpacity: 0.3,

        isActive: formData.isActive,
      })
    }
  }

  const handleEdit = (template: any) => {
    setSelectedTemplate(template)
    setFormData({
      key: template.key,
      name: template.name,
      htmlTemplate: template.htmlTemplate,
      cssTemplate: template.cssTemplate || "",
      description: template.description || "",
      isActive: template.isActive,
      pageSize: (template.pageSize ?? "A4") as "A4" | "LETTER" | "LEGAL",
      orientation: (template.orientation ?? "portrait") as "portrait" | "landscape",
    })
    setIsModalOpen(true)
  }

  if (isLoading) return <LoadingState message="Loading PDF templates..." />

  const templates = templatesData?.data || []
  const variables = variablesData || []
  const filteredTemplates = templates.filter((t: any) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader title="PDF Templates" description="Manage PDF templates for documents and reports">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Button size="sm" onClick={() => { resetForm(); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{templates.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{templates.filter((t: any) => t.isActive).length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredTemplates.length === 0 ? (
            <EmptyState
              title="No PDF templates"
              description="Create your first PDF template"
              icon={FileText}
              onAction={() => setIsModalOpen(true)}
              actionLabel="New Template"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Page Size</TableHead>
                  <TableHead>Orientation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell><div><p className="font-medium">{template.name}</p>{template.description && <p className="text-sm text-gray-500">{template.description}</p>}</div></TableCell>
                    <TableCell className="font-mono text-sm">{template.key}</TableCell>
                    <TableCell><Badge variant="outline">{template.pageSize}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{template.orientation}</Badge></TableCell>
                    <TableCell>{template.isActive ? <Badge variant="default" className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(template)}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicateMutation.mutate({ id: template.id })} disabled={duplicateMutation.isPending}><Copy className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setTemplateToDelete(template)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create PDF Template"}</DialogTitle>
            <DialogDescription>Create or edit PDF templates with HTML/CSS</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="key">Template Key *</Label><Input id="key" placeholder="invoice_template" value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value })} disabled={!!selectedTemplate} /></div>
                <div className="space-y-2"><Label htmlFor="name">Template Name *</Label><Input id="name" placeholder="Invoice Template" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" placeholder="Template for generating invoices" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="pageSize">Page Size</Label><Select value={formData.pageSize} onValueChange={(value) => setFormData({ ...formData, pageSize: value as "A4" | "LETTER" | "LEGAL", })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A4">A4</SelectItem><SelectItem value="LETTER">Letter</SelectItem><SelectItem value="LEGAL">Legal</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="orientation">Orientation</Label><Select value={formData.orientation} onValueChange={(value) => setFormData({ ...formData, orientation: value as "portrait" | "landscape",})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="portrait">Portrait</SelectItem><SelectItem value="landscape">Landscape</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex items-center space-x-2"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" /><Label htmlFor="isActive">Active</Label></div>
            </TabsContent>
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2"><Label htmlFor="htmlTemplate">HTML Template *</Label><Textarea id="htmlTemplate" placeholder="<html><body><h1>{{company}}</h1>...</body></html>" value={formData.htmlTemplate} onChange={(e) => setFormData({ ...formData, htmlTemplate: e.target.value })} rows={10} className="font-mono text-sm" /></div>
              <div className="space-y-2"><Label htmlFor="cssTemplate">CSS Template</Label><Textarea id="cssTemplate" placeholder="body { font-family: Arial; }..." value={formData.cssTemplate} onChange={(e) => setFormData({ ...formData, cssTemplate: e.target.value })} rows={10} className="font-mono text-sm" /></div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !formData.key || !formData.name || !formData.htmlTemplate}>{selectedTemplate ? "Update" : "Create"} Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {templateToDelete && (
        <DeleteConfirmDialog
          open={!!templateToDelete}
          onOpenChange={(open) => {
            if (!open) setTemplateToDelete(null)
          }}
          onConfirm={() => deleteMutation.mutate({ id: templateToDelete.id })}
          title="Delete PDF Template"
          description={`Are you sure you want to delete "${templateToDelete?.name}"?`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
