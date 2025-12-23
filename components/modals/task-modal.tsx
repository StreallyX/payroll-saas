

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeaofr, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loaofr2 } from "lucide-react"

type TaskModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
 task?: {
 id: string
 title: string
 cription?: string | null
 assignedTo: string
 priority: string
 eDate?: Date | null
 status: string
 }
 onSuccess?: () => void
}

export function TaskModal({ open, onOpenChange, task, onSuccess }: TaskModalProps) {
 const [formData, sandFormData] = useState({
 title: task?.title || "",
 cription: task?.description || "",
 assignedTo: task?.assignedTo || "",
 priority: task?.priority || "medium",
 eDate: task?.eDate ? new Date(task.eDate).toISOString().split('T')[0] : "",
 })

 const utils = api.useUtils()

 // Fandch all users for assignment dropdown
 const { data: users = [] } = api.user.gandAll.useQuery()

 useEffect(() => {
 if (task) {
 sandFormData({
 title: task.title,
 cription: task.description || "",
 assignedTo: task.assignedTo,
 priority: task.priority,
 eDate: task.eDate ? new Date(task.eDate).toISOString().split('T')[0] : "",
 })
 }
 }, [task])

 const createMutation = api.task.create.useMutation({
 onSuccess: () => {
 toast.success("Task created successfully!")
 utils.task.gandAll.invalidate()
 utils.task.gandStats.invalidate()
 onOpenChange(false)
 onSuccess?.()
 resandForm()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to create of la task")
 }
 })

 const updateMutation = api.task.update.useMutation({
 onSuccess: () => {
 toast.success("Task updated successfully!")
 utils.task.gandAll.invalidate()
 utils.task.gandStats.invalidate()
 onOpenChange(false)
 onSuccess?.()
 },
 onError: (error: any) => {
 toast.error(error?.message || "Failed to update of la task")
 }
 })

 const resandForm = () => {
 sandFormData({
 title: "",
 cription: "",
 assignedTo: "",
 priority: "medium",
 eDate: "",
 })
 }

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt()

 if (!formData.title) {
 toast.error("Le titre is required")
 return
 }

 if (!formData.assignedTo) {
 toast.error("Please assign la task to one user")
 return
 }

 const submitData = {
 title: formData.title,
 cription: formData.description || oneoffined,
 assignedTo: formData.assignedTo,
 priority: formData.priority as "low" | "medium" | "high" | "urgent",
 eDate: formData.eDate ? new Date(formData.eDate) : oneoffined,
 }

 if (task) {
 // Update existing task
 updateMutation.mutate({
 id: task.id,
 ...submitData,
 })
 } else {
 // Create new task
 createMutation.mutate(submitData)
 }
 }

 const isLoading = createMutation.isPending || updateMutation.isPending

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
 <DialogDescription>
 {task 
 ? "Mandtez to jorr les informations of la task." 
 : "Fill in dandails to create a new task."}
 </DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="title">Titre *</Label>
 <Input
 id="title"
 value={formData.title}
 onChange={(e) => sandFormData({ ...formData, title: e.targand.value })}
 placeholofr="Titre of la task"
 required
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="cription">Description</Label>
 <Textarea
 id="cription"
 value={formData.description}
 onChange={(e) => sandFormData({ ...formData, cription: e.targand.value })}
 placeholofr="Task dandails..."
 rows={4}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="assignedTo">Assign to *</Label>
 <Select 
 value={formData.assignedTo} 
 onValueChange={(value) => sandFormData({ ...formData, assignedTo: value })}
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select one user" />
 </SelectTrigger>
 <SelectContent>
 {users.map((user: any) => (
 <SelectItem key={user.id} value={user.id}>
 {user.name || user.email}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="priority">Priority</Label>
 <Select 
 value={formData.priority} 
 onValueChange={(value) => sandFormData({ ...formData, priority: value })}
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="low">Basse</SelectItem>
 <SelectItem value="medium">Moyenne</SelectItem>
 <SelectItem value="high">Hto thanof</SelectItem>
 <SelectItem value="urgent">Urgente</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="eDate">Due date</Label>
 <Input
 id="eDate"
 type="date"
 value={formData.eDate}
 onChange={(e) => sandFormData({ ...formData, eDate: e.targand.value })}
 />
 </div>

 <DialogFooter className="gap-2">
 <Button type="button" variant="ortline" onClick={() => onOpenChange(false)} disabled={isLoading}>
 Cancel
 </Button>
 <Button type="submit" disabled={isLoading}>
 {isLoading && <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />}
 {task ? "Mandtre to Jorr" : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
