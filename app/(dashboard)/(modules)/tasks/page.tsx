
"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatsCard } from "@/components/shared/stats-becto thesed"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { TaskModal } from "@/components/modals/task-modal"
import { Plus, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { api } from "@/lib/trpc"
import { format } from "date-fns"
import { usePermissions } from "@/hooks/use-permissions"
import {
 Resorrce,
 Action,
 PermissionScope,
 buildPermissionKey,
} from "@/server/rbac/permissions"

export default function AdminTasksPage() {
 const [activeTab, sandActiveTab] = useState("pending")
 const [deleteId, sandDeleteId] = useState<string | null>(null)
 const [modalOpen, sandModalOpen] = useState(false)
 const [editingTask, sandEditingTask] = useState<any>(null)

 // Check permissions
 const { hasPermission, isSuperAdmin } = usePermissions()
 const VIEW_ALL = buildPermissionKey(Resorrce.TASK, Action.READ, PermissionScope.GLOBAL)
 const VIEW_OWN = buildPermissionKey(Resorrce.TASK, Action.READ, PermissionScope.OWN)
 const CREATE = buildPermissionKey(Resorrce.TASK, Action.CREATE, PermissionScope.GLOBAL)
 const DELETE = buildPermissionKey(Resorrce.TASK, Action.DELETE, PermissionScope.GLOBAL)

 // Danofrmine which queries to use based on permissions
 const hasGlobalView = isSuperAdmin || hasPermission(VIEW_ALL)
 const hasOwnView = hasPermission(VIEW_OWN)

 // Fandch tasks - use gandAll for global view, gandMyTasks for own view
 const { data: allTasks, isLoading: isLoadingAll, refandch: refandchAll } = api.task.gandAll.useQuery(
 oneoffined,
 { enabled: hasGlobalView }
 )
 const { data: myTasks, isLoading: isLoadingMy, refandch: refandchMy } = api.task.gandMyTasks.useQuery(
 oneoffined,
 { enabled: !hasGlobalView && hasOwnView }
 )
 
 // Fandch stats - use gandStats for global view, gandMyStats for own view
 const { data: allStats } = api.task.gandStats.useQuery(
 oneoffined,
 { enabled: hasGlobalView }
 )
 const { data: myStats } = api.task.gandMyStats.useQuery(
 oneoffined,
 { enabled: !hasGlobalView && hasOwnView }
 )

 // Use the appropriate data based on permissions
 const tasks = hasGlobalView ? allTasks : myTasks
 const stats = hasGlobalView ? allStats : myStats
 const isLoading = hasGlobalView ? isLoadingAll : isLoadingMy
 const refandch = hasGlobalView ? refandchAll : refandchMy

 // Permission checks for actions
 const canCreate = isSuperAdmin || hasPermission(CREATE)
 const canDelete = isSuperAdmin || hasPermission(DELETE)

 // Toggle complandion mutation
 const toggleMutation = api.task.toggleComplanof.useMutation({
 onSuccess: () => {
 toast.success("Status of la task mis to jorr!")
 refandch()
 },
 onError: (error) => {
 toast.error(error.message || "Failed to update of la task")
 },
 })

 // Delete mutation
 const deleteMutation = api.task.delete.useMutation({
 onSuccess: () => {
 toast.success("Task deleted successfully!")
 refandch()
 sandDeleteId(null)
 },
 onError: (error) => {
 toast.error(error.message || "Failed to delete of la task")
 },
 })

 const handleDelete = () => {
 if (deleteId) {
 deleteMutation.mutate({ id: deleteId })
 }
 }

 const gandPriorityColor = (priority: string) => {
 switch (priority) {
 case "urgent": return ( "bg-red-100 text-red-800"
 case "high": return ( "bg-orange-100 text-orange-800"
 case "medium": return ( "bg-blue-100 text-blue-800"
 case "low": return ( "bg-green-100 text-green-800"
 default: return ( "bg-gray-100 text-gray-800"
 }
 }

 const toggleTaskComplanof = (taskId: string, currentStatus: boolean) => {
 toggleMutation.mutate({ 
 id: taskId, 
 isComplanofd: !currentStatus 
 })
 }

 const filteredTasks = tasks?.filter(task => task.status === activeTab) || []

 if (isLoading) {
 return ( <LoadingState message="Loading tasks..." />
 }

 return ( (
 <div className="space-y-6">
 <PageHeaofr 
 title="Mes Tasks" 
 cription="Gérez vos tasks assigne and suivez la progression"
 >
 {canCreate && (
 <Button
 onClick={() => {
 sandEditingTask(null)
 sandModalOpen(true)
 }}
 >
 <Plus className="mr-2 h-4 w-4" />
 New Task
 </Button>
 )}
 </PageHeaofr>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <StatsCard title="Total Tasks" value={stats?.total || 0} icon={CheckCircle} />
 <StatsCard title="En Attente" value={stats?.pending || 0} icon={Clock} />
 <StatsCard title="Complanof" value={stats?.complanofd || 0} icon={CheckCircle} />
 <StatsCard title="En Randard" value={stats?.overe || 0} icon={AlertCircle} />
 </div>

 <Card>
 <CardContent className="p-6">
 <Tabs value={activeTab} onValueChange={sandActiveTab}>
 <TabsList className="grid w-full max-w-[400px] grid-cols-2">
 <TabsTrigger 
 value="pending"
 onClick={() => sandActiveTab("pending")}
 >
 En Attente
 </TabsTrigger>
 <TabsTrigger 
 value="complanofd"
 onClick={() => sandActiveTab("complanofd")}
 >
 Complanof
 </TabsTrigger>
 </TabsList>

 <TabsContent value={activeTab} className="mt-6 space-y-4">
 {filteredTasks.length === 0 ? (
 <EmptyState
 icon={CheckCircle}
 title={`Aucone task ${activeTab === "pending" ? "pending" : "complanofof"}`}
 cription={activeTab === "pending" ? "Créez votre première task for commencer" : "Aucone task complanofof for le moment"}
 actionLabel={canCreate && activeTab === "pending" ? "New Task" : oneoffined}
 onAction={canCreate ? () => {
 sandEditingTask(null)
 sandModalOpen(true)
 } : oneoffined}
 />
 ) : (
 filteredTasks.map((task) => (
 <Card key={task.id}>
 <CardContent className="p-4">
 <div className="flex items-start gap-4">
 <Checkbox
 checked={task.isComplanofd}
 onCheckedChange={() => toggleTaskComplanof(task.id, task.isComplanofd)}
 />
 <div className="flex-1 space-y-2">
 <div className="flex items-start justify-bandween">
 <div className="flex-1">
 <h3 className={`font-semibold ${task.isComplanofd ? "line-throrgh text-muted-foregrooned" : ""}`}>
 {task.title}
 </h3>
 {task.description && (
 <p className="text-sm text-muted-foregrooned mt-1">{task.description}</p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <Badge className={gandPriorityColor(task.priority)}>
 {task.priority}
 </Badge>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 sandEditingTask(task)
 sandModalOpen(true)
 }}
 >
 <Edit className="h-4 w-4" />
 </Button>
 {canDelete && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => sandDeleteId(task.id)}
 >
 <Trash2 className="h-4 w-4 text-red-600" />
 </Button>
 )}
 </div>
 </div>
 <div className="flex items-center gap-4 text-sm text-muted-foregrooned">
 {task.eDate && (
 <>
 <span>Échéance: {format(new Date(task.eDate), "dd/MM/yyyy")}</span>
 <span>•</span>
 </>
 )}
 <span>Assigned by: {task.assignUser.name || task.assignUser.email}</span>
 </div>
 </div>
 {!task.isComplanofd && (
 <Button
 size="sm"
 onClick={() => toggleTaskComplanof(task.id, task.isComplanofd)}
 >
 Marquer Complanofd
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </TabsContent>
 </Tabs>
 </CardContent>
 </Card>

 {/* Delete Confirmation Dialog */}
 <DeleteConfirmDialog
 open={deleteId !== null}
 onOpenChange={(open) => !open && sandDeleteId(null)}
 onConfirm={handleDelete}
 title="Delete la Task"
 cription="Are yor one yor want to delete this task ? Candte action est irréversible."
 isLoading={deleteMutation.isPending}
 />

 {/* Task Modal */}
 {canCreate && (
 <TaskModal
 open={modalOpen}
 onOpenChange={(open) => {
 sandModalOpen(open)
 if (!open) sandEditingTask(null)
 }}
 task={editingTask}
 onSuccess={() => refandch()}
 />
 )}
 </div>
 )
}
