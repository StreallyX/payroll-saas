
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, CheckCircle, Clock, AlertCircle, Eye, ThumbsUp, ThumbsDown, FileText, Download } from "lucide-react"
import { api } from "@/lib/trpc"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import { downloadFile } from "@/lib/s3"

export default function ManageOnboardingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContractor, setSelectedContractor] = useState<any>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const { data: contractorsOnboarding, isLoading, refetch } = api.onboarding.getAllContractorOnboarding.useQuery()
  const utils = api.useUtils()

  const approveMutation = api.onboarding.approveResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse approuvée avec succès")
      refetch()
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message)
    },
  })

  const rejectMutation = api.onboarding.rejectResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse rejetée avec succès")
      refetch()
      setRejectDialogOpen(false)
      setAdminNotes("")
      setSelectedResponse(null)
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message)
    },
  })

  const handleApprove = (responseId: string) => {
    approveMutation.mutate({ responseId })
  }

  const handleRejectClick = (response: any) => {
    setSelectedResponse(response)
    setRejectDialogOpen(true)
  }

  const handleRejectSubmit = () => {
    if (!selectedResponse) return
    if (!adminNotes.trim()) {
      toast.error("Veuillez fournir une raison pour le rejet")
      return
    }
    rejectMutation.mutate({
      responseId: selectedResponse.id,
      adminNotes: adminNotes.trim()
    })
  }

  const handleViewFile = async (filePath: string) => {
    try {
      const signedUrl = await downloadFile(filePath)
      window.open(signedUrl, '_blank')
    } catch (error: any) {
      toast.error("Erreur lors de l'ouverture du fichier: " + error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredContractors = contractorsOnboarding?.filter(contractor => {
    const query = searchQuery.toLowerCase()
    return (
      contractor.user?.name?.toLowerCase().includes(query) ||
      contractor.user?.email?.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return <LoadingState message="Chargement des onboardings..." />
  }

  // Calculate stats
  const stats = {
    total: contractorsOnboarding?.length || 0,
    pending: contractorsOnboarding?.filter(c => c.stats.pendingResponses > 0).length || 0,
    completed: contractorsOnboarding?.filter(c => c.stats.progress === 100).length || 0,
    inProgress: contractorsOnboarding?.filter(c => c.stats.progress > 0 && c.stats.progress < 100).length || 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de l'Onboarding"
        description="Validez les informations d'onboarding des contractors"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completeds</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contractors List */}
      {!filteredContractors || filteredContractors.length === 0 ? (
        <EmptyState 
          title="Aucun onboarding trouvé" 
          description="Aucun contractor n'a encore d'onboarding à valider."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredContractors.map((contractor) => (
            <Card key={contractor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {contractor.user?.name || "Nom non disponible"}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {contractor.user?.email}
                    </CardDescription>
                    <p className="text-sm text-gray-600 mt-1">
                      Template: {contractor.onboardingTemplate?.name || "Aucun"}
                    </p>
                  </div>
                  <Badge variant={contractor.stats.progress === 100 ? "default" : "secondary"}>
                    {contractor.stats.progress}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium">
                      {contractor.stats.completedResponses}/{contractor.stats.totalQuestions}
                    </span>
                  </div>
                  <Progress value={contractor.stats.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Réponses approuvées</p>
                    <p className="font-medium text-green-600">
                      {contractor.stats.completedResponses}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pending</p>
                    <p className="font-medium text-yellow-600">
                      {contractor.stats.pendingResponses}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedContractor(contractor)
                    setViewDetailsOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'Onboarding</DialogTitle>
            <DialogDescription>
              {selectedContractor?.user?.name} - {selectedContractor?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedContractor?.onboardingResponses?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucune réponse soumise pour le moment
              </p>
            ) : (
              selectedContractor?.onboardingResponses?.map((response: any) => (
                <Card key={response.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {response.question.questionText}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Type: {response.question.questionType}
                          {response.question.isRequired && (
                            <span className="text-red-500 ml-2">*Obligatoire</span>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(response.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {response.responseText && (
                      <div>
                        <Label className="text-xs text-gray-500">Réponse:</Label>
                        <p className="mt-1">{response.responseText}</p>
                      </div>
                    )}
                    
                    {response.responseFilePath && (
                      <div>
                        <Label className="text-xs text-gray-500">Document:</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() => handleViewFile(response.responseFilePath)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Voir le document
                        </Button>
                      </div>
                    )}

                    {response.adminNotes && (
                      <div>
                        <Label className="text-xs text-gray-500">Notes admin:</Label>
                        <p className="mt-1 text-sm text-red-600">{response.adminNotes}</p>
                      </div>
                    )}

                    {response.status === "pending" && (response.responseText || response.responseFilePath) && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleApprove(response.id)}
                          disabled={approveMutation.isPending}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleRejectClick(response)}
                          disabled={rejectMutation.isPending}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    )}

                    {response.reviewedAt && (
                      <p className="text-xs text-gray-500">
                        Validé le: {new Date(response.reviewedAt).toLocaleString("fr-FR")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewDetailsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la réponse</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison pour le rejet de cette réponse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adminNotes">Raison du rejet *</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex: Le document n'est pas lisible, informations incomplètes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setAdminNotes("")
                setSelectedResponse(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!adminNotes.trim() || rejectMutation.isPending}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
