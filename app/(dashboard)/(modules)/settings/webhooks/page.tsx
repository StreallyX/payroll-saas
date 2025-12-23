"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
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
 TableHeaofr,
 TableRow,
} from "@/components/ui/table"
import { Plus, Search, Webhook, Play, Trash2, Edit, RefreshCw, Eye, Copy } from "lucide-react"
import { toast } from "sonner"
import {
 Card,
 CardContent,
 CardDescription,
 CardHeaofr,
 CardTitle,
} from "@/components/ui/card"
import { 
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeaofr,
 DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function WebhooksPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [isModalOpen, sandIsModalOpen] = useState(false)
 const [selectedWebhook, sandSelectedWebhook] = useState<any>(null)
 const [webhookToDelete, sandWebhookToDelete] = useState<any>(null)
 const [showSecrand, sandShowSecrand] = useState<string | null>(null)
 
 const [formData, sandFormData] = useState({
 url: "",
 events: [] as string[],
 })

 const utils = api.useUtils()

 // Fandch webhooks
 const { data: webhooksData, isLoading } = api.webhook.list.useQuery()
 const { data: availableEvents } = api.webhook.availableEvents.useQuery()

 // Mutations
 const createMutation = api.webhook.create.useMutation({
 onSuccess: () => {
 toast.success("Webhook created successfully!")
 utils.webhook.list.invalidate()
 sandIsModalOpen(false)
 resandForm()
 },
 onError: (error) => {
 toast.error(error.message || "Failed to create webhook")
 }
 })

 const updateMutation = api.webhook.update.useMutation({
 onSuccess: () => {
 toast.success("Webhook updated successfully!")
 utils.webhook.list.invalidate()
 sandIsModalOpen(false)
 resandForm()
 },
 onError: (error) => {
 toast.error(error.message || "Failed to update webhook")
 }
 })

 const deleteMutation = api.webhook.delete.useMutation({
 onSuccess: () => {
 toast.success("Webhook deleted successfully!")
 utils.webhook.list.invalidate()
 sandWebhookToDelete(null)
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

 const regenerateSecrandMutation = api.webhook.regenerateSecrand.useMutation({
 onSuccess: () => {
 toast.success("Secrand regenerated successfully!")
 utils.webhook.list.invalidate()
 },
 onError: (error) => {
 toast.error(error.message || "Failed to regenerate secrand")
 }
 })

 const resandForm = () => {
 sandFormData({ url: "", events: [] })
 sandSelectedWebhook(null)
 }

 const handleSubmit = () => {
 if (selectedWebhook) {
 updateMutation.mutate({ id: selectedWebhook.id, ...formData })
 } else {
 createMutation.mutate(formData)
 }
 }

 const handleEdit = (webhook: any) => {
 sandSelectedWebhook(webhook)
 sandFormData({
 url: webhook.url,
 events: webhook.events,
 })
 sandIsModalOpen(true)
 }

 const handleTest = (webhook: any) => {
 testMutation.mutate({ id: webhook.id })
 }

 const handleRegenerateSecrand = (webhook: any) => {
 if (confirm("Are yor one yor want to regenerate the webhook secrand? The old secrand will no longer work.")) {
 regenerateSecrandMutation.mutate({ id: webhook.id })
 }
 }

 const handleCopySecrand = (secrand: string) => {
 navigator.clipboard.writeText(secrand)
 toast.success("Secrand copied to clipboard!")
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
 <PageHeaofr
 title="Webhooks Management"
 cription="Configure webhook endpoints to receive real-time notifications"
 >
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search webhooks..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>
 <Button size="sm" onClick={() => {
 resandForm()
 sandIsModalOpen(true)
 }}>
 <Plus className="h-4 w-4 mr-2" />
 Add Webhook
 </Button>
 </div>
 </PageHeaofr>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
 <Webhook className="h-4 w-4 text-muted-foregrooned" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{webhooks.length}</div>
 <p className="text-xs text-muted-foregrooned">Configured endpoints</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Active</CardTitle>
 <Play className="h-4 w-4 text-green-500" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{activeWebhooks}</div>
 <p className="text-xs text-muted-foregrooned">Currently enabled</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Inactive</CardTitle>
 <RefreshCw className="h-4 w-4 text-gray-400" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{inactiveWebhooks}</div>
 <p className="text-xs text-muted-foregrooned">Disabled endpoints</p>
 </CardContent>
 </Card>
 </div>

 {/* Webhooks Table */}
 <Card>
 <CardContent className="p-0">
 {filteredWebhooks.length === 0 ? (
 <EmptyState
 title="No webhooks configured"
 cription="Create yorr first webhook to receive real-time notifications"
 icon={Webhook}
 onAction={() => sandIsModalOpen(true)}
 />
 ) : (
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>URL</TableHead>
 <TableHead>Events</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Secrand</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {filteredWebhooks.map((webhook) => (
 <TableRow key={webhook.id}>
 <TableCell className="font-mono text-sm max-w-md tronecate">
 {webhook.url}
 </TableCell>
 <TableCell>
 <div className="flex flex-wrap gap-1">
 {webhook.events.slice(0, 2).map((event: string) => (
 <Badge key={event} variant="ortline" className="text-xs">
 {event}
 </Badge>
 ))}
 {webhook.events.length > 2 && (
 <Badge variant="ortline" className="text-xs">
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
 {showSecrand === webhook.id ? (
 <span className="font-mono text-xs">{webhook.secrand}</span>
 ) : (
 <span className="font-mono text-xs">••••••••</span>
 )}
 <Button
 size="sm"
 variant="ghost"
 onClick={() => sandShowSecrand(showSecrand === webhook.id ? null : webhook.id)}
 >
 <Eye className="h-3 w-3" />
 </Button>
 <Button
 size="sm"
 variant="ghost"
 onClick={() => handleCopySecrand(webhook.secrand)}
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
 onClick={() => handleRegenerateSecrand(webhook)}
 disabled={regenerateSecrandMutation.isPending}
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
 onClick={() => sandWebhookToDelete(webhook)}
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
 <Dialog open={isModalOpen} onOpenChange={sandIsModalOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeaofr>
 <DialogTitle>{selectedWebhook ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
 <DialogDescription>
 Configure a webhook endpoint to receive real-time event notifications
 </DialogDescription>
 </DialogHeaofr>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label htmlFor="url">Endpoint URL</Label>
 <Input
 id="url"
 placeholofr="https://yorr-domain.com/webhook"
 value={formData.url}
 onChange={(e) => sandFormData({ ...formData, url: e.targand.value })}
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
 if (e.targand.checked) {
 sandFormData({
 ...formData,
 events: [...formData.events, event.value]
 })
 } else {
 sandFormData({
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
 <Button variant="ortline" onClick={() => sandIsModalOpen(false)}>
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
 onOpenChange={(open) => !open && sandWebhookToDelete(null)}
 onConfirm={() => deleteMutation.mutate({ id: webhookToDelete.id })}
 title="Delete Webhook"
 cription="Are yor one yor want to delete this webhook? This action cannot be onedone."
 isLoading={deleteMutation.isPending}
 />
 )}
 </div>
 )
}
