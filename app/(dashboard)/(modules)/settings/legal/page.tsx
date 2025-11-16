"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileText, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LegalDocumentsPage() {
  const { toast } = useToast()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [previewTitle, setPreviewTitle] = useState("")
  
  const [termsOfService, setTermsOfService] = useState("")
  const [termsVersion, setTermsVersion] = useState("1.0")
  const [privacyPolicy, setPrivacyPolicy] = useState("")
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState("1.0")

  const { data: legalDocs, refetch, isLoading } = api.tenant.getLegalDocuments.useQuery()

  useEffect(() => {
    if (legalDocs) {
      setTermsOfService(legalDocs.termsOfService || "")
      setTermsVersion(legalDocs.termsVersion || "1.0")
      setPrivacyPolicy(legalDocs.privacyPolicy || "")
      setPrivacyPolicyVersion(legalDocs.privacyPolicyVersion || "1.0")
    }
  }, [legalDocs])

  const updateMutation = api.tenant.updateLegalDocuments.useMutation({
    onSuccess: () => {
      toast({
        title: "Legal Documents Updated",
        description: "Your legal documents have been saved successfully.",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update legal documents.",
        variant: "destructive",
      })
    },
  })

  const handleSaveTerms = () => {
    updateMutation.mutate({
      termsOfService,
      termsVersion,
    })
  }

  const handleSavePrivacy = () => {
    updateMutation.mutate({
      privacyPolicy,
      privacyPolicyVersion,
    })
  }

  const handlePreview = (content: string, title: string) => {
    setPreviewContent(content)
    setPreviewTitle(title)
    setIsPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Documents"
        description="Manage your organization's terms of service and privacy policy"
      />

      <Tabs defaultValue="terms" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Terms of Service</CardTitle>
                  <CardDescription>
                    Define the terms and conditions for using your platform
                  </CardDescription>
                </div>
                {termsOfService && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(termsOfService, "Terms of Service")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="termsVersion">Version</Label>
                <Input
                  id="termsVersion"
                  value={termsVersion}
                  onChange={(e) => setTermsVersion(e.target.value)}
                  placeholder="1.0"
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Update the version number when making significant changes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsContent">Content</Label>
                <Textarea
                  id="termsContent"
                  value={termsOfService}
                  onChange={(e) => setTermsOfService(e.target.value)}
                  placeholder="Enter your terms of service here. You can use Markdown or HTML formatting..."
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Supports Markdown and HTML formatting
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleSaveTerms}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Save Terms
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Privacy Policy</CardTitle>
                  <CardDescription>
                    Explain how you collect, use, and protect user data
                  </CardDescription>
                </div>
                {privacyPolicy && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(privacyPolicy, "Privacy Policy")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="privacyVersion">Version</Label>
                <Input
                  id="privacyVersion"
                  value={privacyPolicyVersion}
                  onChange={(e) => setPrivacyPolicyVersion(e.target.value)}
                  placeholder="1.0"
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Update the version number when making significant changes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyContent">Content</Label>
                <Textarea
                  id="privacyContent"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="Enter your privacy policy here. You can use Markdown or HTML formatting..."
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Supports Markdown and HTML formatting
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleSavePrivacy}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Save Privacy Policy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-yellow-900">
            Important Legal Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-800">
            These legal documents are important for compliance and user protection. We recommend
            having them reviewed by a legal professional before publishing. Once published, users
            will be able to view these documents when signing up or from the footer of your
            application.
          </p>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none border rounded-lg p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
