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
import { Loader2, Plus, Edit, Trash2, Eye, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface EmailTemplateForm {
  id?: string
  name: string
  displayName: string
  description: string
  category: string
  subject: string
  htmlBody: string
  textBody: string
  headerHtml: string
  footerHtml: string
}

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateForm | null>(null)

  const [form, setForm] = useState<EmailTemplateForm>({
    name: "",
    displayName: "",
    description: "",
    category: "notifications",
    subject: "",
    htmlBody: "",
    textBody: "",
    headerHtml: "",
    footerHtml: "",
  })

  const { data: templates, refetch, isLoading } = api.tenant.listEmailTemplates.useQuery()

  const createMutation = api.tenant.createEmailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
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

  const updateMutation = api.tenant.updateEmailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
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

  const deleteMutation = api.tenant.deleteEmailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
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
      category: "notifications",
      subject: "",
      htmlBody: "",
      textBody: "",
      headerHtml: "",
      footerHtml: "",
    })
    setEditingTemplate(null)
  }

  const handleEdit = (template: any) => {
    setForm({
      id: template.id,
      name: template.name,
      displayName: template.displayName,
      description: template.description || "",
      category: template.category,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody || "",
      headerHtml: template.headerHtml || "",
      footerHtml: template.footerHtml || "",
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
        subject: form.subject,
        htmlBody: form.htmlBody,
        textBody: form.textBody,
      })
    } else {
      createMutation.mutate({
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        displayName: form.displayName,
        description: form.description,
        category: form.category,
        subject: form.subject,
        htmlBody: form.htmlBody,
        textBody: form.textBody,
        headerHtml: form.headerHtml,
        footerHtml: form.footerHtml,
      })
    }
  }

  const handlePreview = (template: any) => {
    const fullHtml = `
      ${template.headerHtml || ""}
      ${template.htmlBody}
      ${template.footerHtml || ""}
    `
    setPreviewHtml(fullHtml)
    setIsPreviewOpen(true)
  }

  const categoryColors: Record<string, string> = {
    authentication: "bg-blue-100 text-blue-800",
    notifications: "bg-green-100 text-green-800",
    invoicing: "bg-yellow-100 text-yellow-800",
    contracts: "bg-purple-100 text-purple-800",
    system: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage custom email templates for your organization"
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
                  <Badge className={categoryColors[template.category] || categoryColors.system}>
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject:</p>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Sent: {template.sentCount} times</span>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
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
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No email templates yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first email template to get started.
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Create"} Email Template</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the email template details."
                : "Create a new custom email template for your organization."}
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
                    placeholder="welcome_email"
                  />
                  <p className="text-xs text-gray-500">
                    Internal identifier (use lowercase and underscores)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="authentication">Authentication</option>
                    <option value="notifications">Notifications</option>
                    <option value="invoicing">Invoicing</option>
                    <option value="contracts">Contracts</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Welcome Email"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Email sent to new users..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Welcome to {{company_name}}!"
              />
              <p className="text-xs text-gray-500">
                Use variables like {`{{variable_name}}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>HTML Body</Label>
              <Textarea
                value={form.htmlBody}
                onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
                placeholder="<h1>Welcome!</h1><p>Hello {{user_name}},</p>"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {!editingTemplate && (
              <>
                <div className="space-y-2">
                  <Label>Header HTML (Optional)</Label>
                  <Textarea
                    value={form.headerHtml}
                    onChange={(e) => setForm({ ...form, headerHtml: e.target.value })}
                    placeholder="<div>Company Logo</div>"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Footer HTML (Optional)</Label>
                  <Textarea
                    value={form.footerHtml}
                    onChange={(e) => setForm({ ...form, footerHtml: e.target.value })}
                    placeholder="<div>© 2024 Company Name</div>"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Plain Text Body (Optional)</Label>
              <Textarea
                value={form.textBody}
                onChange={(e) => setForm({ ...form, textBody: e.target.value })}
                placeholder="Welcome! Hello {{user_name}},"
                rows={5}
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

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
