"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Mail, Edit, Trash2, Copy, Eye, Code } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EmailTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateToDelete, setTemplateToDelete] = useState<any>(null)
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    subject: "",
    body: "",
    description: "",
    isActive: true,
  })

  const utils = api.useUtils()

  // Fetch templates
  const { data: templatesData, isLoading } = api.emailTemplate.getAll.useQuery()
  const { data: variablesData } = api.emailTemplate.getVariables.useQuery()

  // Mutations
  const createMutation = api.emailTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Email template created successfully!")
      utils.emailTemplate.getAll.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template")
    }
  })

  const updateMutation = api.emailTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("Email template updated successfully!")
      utils.emailTemplate.getAll.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template")
    }
  })

  const deleteMutation = api.emailTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("Email template deleted successfully!")
      utils.emailTemplate.getAll.invalidate()
      setTemplateToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template")
    }
  })

  const duplicateMutation = api.emailTemplate.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated successfully!")
      utils.emailTemplate.getAll.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate template")
    }
  })

  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      subject: "",
      body: "",
      description: "",
      isActive: true,
    })
    setSelectedTemplate(null)
  }

  const handleSubmit = () => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (template: any) => {
    setSelectedTemplate(template)
    setFormData({
      key: template.key,
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description || "",
      isActive: template.isActive,
    })
    setIsModalOpen(true)
  }

  const handleDuplicate = (template: any) => {
    duplicateMutation.mutate({ id: template.id })
  }

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      body: formData.body + `{{${variable}}}`
    })
  }

  if (isLoading) {
    return <LoadingState message="Loading email templates..." />
  }

  const templates = templatesData?.data || []
  const variables = variablesData?.data || []
  const filteredTemplates = templates.filter((t: any) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeTemplates = templates.filter((t: any) => t.isActive).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage email templates for automated notifications"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button size="sm" onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Mail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTemplates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTemplates.length === 0 ? (
            <EmptyState
              title="No email templates"
              description="Create your first email template"
              icon={Mail}
              action={
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{template.key}</TableCell>
                    <TableCell className="max-w-md truncate">{template.subject}</TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(template)}
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTemplateToDelete(template)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Email Template"}</DialogTitle>
            <DialogDescription>
              Create or edit email templates with dynamic variables
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Template Key *</Label>
                  <Input
                    id="key"
                    placeholder="welcome_email"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    disabled={!!selectedTemplate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="Welcome Email"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Sent when a user signs up"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </TabsContent>
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Welcome to {{company}}!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Email Body *</Label>
                <Textarea
                  id="body"
                  placeholder="Hello {{name}},&#10;&#10;Welcome to our platform!..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
            <TabsContent value="variables" className="space-y-4">
              <p className="text-sm text-gray-600">
                Click on a variable to insert it at the cursor position in the email body:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {variables.map((variable: any) => (
                  <div
                    key={variable.key}
                    className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => insertVariable(variable.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{`{{${variable.key}}}`}</span>
                      <Code className="h-3 w-3 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Example: {variable.example}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.key || !formData.name || !formData.subject || !formData.body}
            >
              {selectedTemplate ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {templateToDelete && (
        <DeleteConfirmDialog
          isOpen={!!templateToDelete}
          onClose={() => setTemplateToDelete(null)}
          onConfirm={() => deleteMutation.mutate({ id: templateToDelete.id })}
          title="Delete Email Template"
          description={`Are you sure you want to delete "${templateToDelete.name}"? This action cannot be undone.`}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
