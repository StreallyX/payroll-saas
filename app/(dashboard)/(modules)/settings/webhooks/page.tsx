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
import { Plus, Search, Webhook, Play, Trash2, Edit, RefreshCw, Eye, Copy } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
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

export default function WebhooksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [webhookToDelete, setWebhookToDelete] = useState<any>(null)
  const [showSecret, setShowSecret] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    url: "",
    events: [] as string[],
  })

  const utils = api.useUtils()

  // Fetch webhooks
  const { data: webhooksData, isLoading } = api.webhook.list.useQuery()
  const { data: availableEvents } = api.webhook.availableEvents.useQuery()

  // Mutations
  const createMutation = api.webhook.create.useMutation({
    onSuccess: () => {
      toast.success("Webhook created successfully!")
      utils.webhook.list.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create webhook")
    }
  })

  const updateMutation = api.webhook.update.useMutation({
    onSuccess: () => {
      toast.success("Webhook updated successfully!")
      utils.webhook.list.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update webhook")
    }
  })

  const deleteMutation = api.webhook.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook deleted successfully!")
      utils.webhook.list.invalidate()
      setWebhookToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete webhook")
    }
  })

  const testMutation = api.webhook.test.useMutation({
    onSuccess: (data) => {
      if (data.data.success) {
        toast.success("Webhook test successful!")
      } else {
        toast.error("Webhook test failed: " + data.data.response)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to test webhook")
    }
  })

  const regenerateSecretMutation = api.webhook.regenerateSecret.useMutation({
    onSuccess: () => {
      toast.success("Secret regenerated successfully!")
      utils.webhook.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate secret")
    }
  })

  const resetForm = () => {
    setFormData({ url: "", events: [] })
    setSelectedWebhook(null)
  }

  const handleSubmit = () => {
    if (selectedWebhook) {
      updateMutation.mutate({ id: selectedWebhook.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (webhook: any) => {
    setSelectedWebhook(webhook)
    setFormData({
      url: webhook.url,
      events: webhook.events,
    })
    setIsModalOpen(true)
  }

  const handleTest = (webhook: any) => {
    testMutation.mutate({ id: webhook.id })
  }

  const handleRegenerateSecret = (webhook: any) => {
    if (confirm("Are you sure you want to regenerate the webhook secret? The old secret will no longer work.")) {
      regenerateSecretMutation.mutate({ id: webhook.id })
    }
  }

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success("Secret copied to clipboard!")
  }

  if (isLoading) {
    return <LoadingState message="Loading webhooks..." />
  }

  const webhooks = webhooksData?.data || []
  const filteredWebhooks = webhooks.filter(w =>
    w.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeWebhooks = webhooks.filter(w => w.isActive).length
  const inactiveWebhooks = webhooks.filter(w => !w.isActive).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks Management"
        description="Configure webhook endpoints to receive real-time notifications"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search webhooks..."
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
            Add Webhook
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <p className="text-xs text-muted-foreground">Configured endpoints</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWebhooks}</div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveWebhooks}</div>
            <p className="text-xs text-muted-foreground">Disabled endpoints</p>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardContent className="p-0">
          {filteredWebhooks.length === 0 ? (
            <EmptyState
              title="No webhooks configured"
              description="Create your first webhook to receive real-time notifications"
              icon={Webhook}
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-md truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event: string) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {showSecret === webhook.id ? (
                          <span className="font-mono text-xs">{webhook.secret}</span>
                        ) : (
                          <span className="font-mono text-xs">••••••••</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTest(webhook)}
                          disabled={testMutation.isPending}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRegenerateSecret(webhook)}
                          disabled={regenerateSecretMutation.isPending}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(webhook)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setWebhookToDelete(webhook)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWebhook ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive real-time event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                placeholder="https://your-domain.com/webhook"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {Object.entries(availableEvents?.data || {}).map(([category, events]) => (
                  <div key={category} className="space-y-1">
                    <p className="text-sm font-medium capitalize">{category}</p>
                    {(events as any[]).map((event: any) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                events: [...formData.events, event.value]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                events: formData.events.filter(ev => ev !== event.value)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={event.value} className="text-sm">
                          {event.value}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.url || formData.events.length === 0}
            >
              {selectedWebhook ? "Update" : "Create"} Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {webhookToDelete && (
        <DeleteConfirmDialog
          open={!!webhookToDelete}
          onOpenChange={(open) => !open && setWebhookToDelete(null)}
          onConfirm={() => deleteMutation.mutate({ id: webhookToDelete.id })}
          title="Delete Webhook"
          description="Are you sure you want to delete this webhook? This action cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
