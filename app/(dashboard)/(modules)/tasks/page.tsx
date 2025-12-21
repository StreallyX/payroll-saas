
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatsCard } from "@/components/shared/stats-card"
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
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions"

export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  // Check permissions
  const { hasPermission, isSuperAdmin } = usePermissions()
  const VIEW_ALL = buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.GLOBAL)
  const VIEW_OWN = buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN)
  const CREATE = buildPermissionKey(Resource.TASK, Action.CREATE, PermissionScope.GLOBAL)
  const DELETE = buildPermissionKey(Resource.TASK, Action.DELETE, PermissionScope.GLOBAL)

  // Determine which queries to use based on permissions
  const hasGlobalView = isSuperAdmin || hasPermission(VIEW_ALL)
  const hasOwnView = hasPermission(VIEW_OWN)

  // Fetch tasks - use getAll for global view, getMyTasks for own view
  const { data: allTasks, isLoading: isLoadingAll, refetch: refetchAll } = api.task.getAll.useQuery(
    undefined,
    { enabled: hasGlobalView }
  )
  const { data: myTasks, isLoading: isLoadingMy, refetch: refetchMy } = api.task.getMyTasks.useQuery(
    undefined,
    { enabled: !hasGlobalView && hasOwnView }
  )
  
  // Fetch stats - use getStats for global view, getMyStats for own view
  const { data: allStats } = api.task.getStats.useQuery(
    undefined,
    { enabled: hasGlobalView }
  )
  const { data: myStats } = api.task.getMyStats.useQuery(
    undefined,
    { enabled: !hasGlobalView && hasOwnView }
  )

  // Use the appropriate data based on permissions
  const tasks = hasGlobalView ? allTasks : myTasks
  const stats = hasGlobalView ? allStats : myStats
  const isLoading = hasGlobalView ? isLoadingAll : isLoadingMy
  const refetch = hasGlobalView ? refetchAll : refetchMy

  // Permission checks for actions
  const canCreate = isSuperAdmin || hasPermission(CREATE)
  const canDelete = isSuperAdmin || hasPermission(DELETE)

  // Toggle completion mutation
  const toggleMutation = api.task.toggleComplete.useMutation({
    onSuccess: () => {
      toast.success("Statut de la tâche mis à jour!")
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update de la tâche")
    },
  })

  // Delete mutation
  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      toast.success("Tâche deleted successfully!")
      refetch()
      setDeleteId(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete de la tâche")
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-blue-100 text-blue-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const toggleTaskComplete = (taskId: string, currentStatus: boolean) => {
    toggleMutation.mutate({ 
      id: taskId, 
      isCompleted: !currentStatus 
    })
  }

  const filteredTasks = tasks?.filter(task => task.status === activeTab) || []

  if (isLoading) {
    return <LoadingState message="Chargement des tâches..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mes Tâches" 
        description="Gérez vos tâches assignées et suivez la progression"
      >
        {canCreate && (
          <Button
            onClick={() => {
              setEditingTask(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Tâche
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total des Tâches" value={stats?.total || 0} icon={CheckCircle} />
        <StatsCard title="En Attente" value={stats?.pending || 0} icon={Clock} />
        <StatsCard title="Completedes" value={stats?.completed || 0} icon={CheckCircle} />
        <StatsCard title="En Retard" value={stats?.overdue || 0} icon={AlertCircle} />
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger 
                value="pending"
                onClick={() => setActiveTab("pending")}
              >
                En Attente
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                onClick={() => setActiveTab("completed")}
              >
                Completedes
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-4">
              {filteredTasks.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title={`Aucune tâche ${activeTab === "pending" ? "en attente" : "terminée"}`}
                  description={activeTab === "pending" ? "Créez votre première tâche pour commencer" : "Aucune tâche terminée pour le moment"}
                  actionLabel={canCreate && activeTab === "pending" ? "New Tâche" : undefined}
                  onAction={canCreate ? () => {
                    setEditingTask(null)
                    setModalOpen(true)
                  } : undefined}
                />
              ) : (
                filteredTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => toggleTaskComplete(task.id, task.isCompleted)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTask(task)
                                  setModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(task.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {task.dueDate && (
                              <>
                                <span>Échéance: {format(new Date(task.dueDate), "dd/MM/yyyy")}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>Assigné par: {task.assignerUser.name || task.assignerUser.email}</span>
                          </div>
                        </div>
                        {!task.isCompleted && (
                          <Button
                            size="sm"
                            onClick={() => toggleTaskComplete(task.id, task.isCompleted)}
                          >
                            Marquer Completed
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
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete la Tâche"
        description="Are you sure you want to delete cette tâche ? Cette action est irréversible."
        isLoading={deleteMutation.isPending}
      />

      {/* Task Modal */}
      {canCreate && (
        <TaskModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open)
            if (!open) setEditingTask(null)
          }}
          task={editingTask}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
