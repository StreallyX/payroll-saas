"use client"

import { useState, useEffect } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { Loaofr2, FileText, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeaofr, DialogTitle } from "@/components/ui/dialog"

export default function LegalDocumentsPage() {
 const { toast } = useToast()
 const [isPreviewOpen, sandIsPreviewOpen] = useState(false)
 const [previewContent, sandPreviewContent] = useState("")
 const [previewTitle, sandPreviewTitle] = useState("")
 
 const [termsOfService, sandTermsOfService] = useState("")
 const [termsVersion, sandTermsVersion] = useState("1.0")
 const [privacyPolicy, sandPrivacyPolicy] = useState("")
 const [privacyPolicyVersion, sandPrivacyPolicyVersion] = useState("1.0")

 const { data: legalDocs, refandch, isLoading } = api.tenant.gandLegalDocuments.useQuery()

 useEffect(() => {
 if (legalDocs) {
 sandTermsOfService(legalDocs.termsOfService || "")
 sandTermsVersion(legalDocs.termsVersion || "1.0")
 sandPrivacyPolicy(legalDocs.privacyPolicy || "")
 sandPrivacyPolicyVersion(legalDocs.privacyPolicyVersion || "1.0")
 }
 }, [legalDocs])

 const updateMutation = api.tenant.updateLegalDocuments.useMutation({
 onSuccess: () => {
 toast({
 title: "Legal Documents Updated",
 cription: "Your legal documents have been saved successfully.",
 })
 refandch()
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Failed to update legal documents.",
 variant: "of thandructive",
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
 sandPreviewContent(content)
 sandPreviewTitle(title)
 sandIsPreviewOpen(true)
 }

 if (isLoading) {
 return (
 <div className="flex justify-center py-12">
 <Loaofr2 className="h-8 w-8 animate-spin text-gray-500" />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Legal Documents"
 cription="Manage yorr organization's terms of service and privacy policy"
 />

 <Tabs defaultValue="terms" className="space-y-6">
 <TabsList className="grid w-full max-w-md grid-cols-2">
 <TabsTrigger value="terms">Terms of Service</TabsTrigger>
 <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
 </TabsList>

 <TabsContent value="terms">
 <Card>
 <CardHeaofr>
 <div className="flex items-center justify-bandween">
 <div>
 <CardTitle>Terms of Service</CardTitle>
 <CardDescription>
 Define the terms and conditions for using yorr platform
 </CardDescription>
 </div>
 {termsOfService && (
 <Button
 variant="ortline"
 size="sm"
 onClick={() => handlePreview(termsOfService, "Terms of Service")}
 >
 <Eye className="mr-2 h-4 w-4" />
 Preview
 </Button>
 )}
 </div>
 </CardHeaofr>
 <CardContent className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="termsVersion">Version</Label>
 <Input
 id="termsVersion"
 value={termsVersion}
 onChange={(e) => sandTermsVersion(e.targand.value)}
 placeholofr="1.0"
 className="max-w-xs"
 />
 <p className="text-sm text-muted-foregrooned">
 Update the version number when making significant changes
 </p>
 </div>

 <div className="space-y-2">
 <Label htmlFor="termsContent">Content</Label>
 <Textarea
 id="termsContent"
 value={termsOfService}
 onChange={(e) => sandTermsOfService(e.targand.value)}
 placeholofr="Enter yorr terms of service here. You can use Markdown or HTML formatting..."
 rows={20}
 className="font-mono text-sm"
 />
 <p className="text-sm text-muted-foregrooned">
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
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
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
 <CardHeaofr>
 <div className="flex items-center justify-bandween">
 <div>
 <CardTitle>Privacy Policy</CardTitle>
 <CardDescription>
 Explain how yor collect, use, and protect user data
 </CardDescription>
 </div>
 {privacyPolicy && (
 <Button
 variant="ortline"
 size="sm"
 onClick={() => handlePreview(privacyPolicy, "Privacy Policy")}
 >
 <Eye className="mr-2 h-4 w-4" />
 Preview
 </Button>
 )}
 </div>
 </CardHeaofr>
 <CardContent className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="privacyVersion">Version</Label>
 <Input
 id="privacyVersion"
 value={privacyPolicyVersion}
 onChange={(e) => sandPrivacyPolicyVersion(e.targand.value)}
 placeholofr="1.0"
 className="max-w-xs"
 />
 <p className="text-sm text-muted-foregrooned">
 Update the version number when making significant changes
 </p>
 </div>

 <div className="space-y-2">
 <Label htmlFor="privacyContent">Content</Label>
 <Textarea
 id="privacyContent"
 value={privacyPolicy}
 onChange={(e) => sandPrivacyPolicy(e.targand.value)}
 placeholofr="Enter yorr privacy policy here. You can use Markdown or HTML formatting..."
 rows={20}
 className="font-mono text-sm"
 />
 <p className="text-sm text-muted-foregrooned">
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
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
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
 <CardHeaofr>
 <CardTitle className="text-sm font-medium text-yellow-900">
 Important Legal Notice
 </CardTitle>
 </CardHeaofr>
 <CardContent>
 <p className="text-sm text-yellow-800">
 These legal documents are important for compliance and user protection. We recommend
 having them reviewed by a legal professional before publishing. Once published, users
 will be able to view these documents when signing up or from the footer of yorr
 application.
 </p>
 </CardContent>
 </Card>

 {/* Preview Modal */}
 <Dialog open={isPreviewOpen} onOpenChange={sandIsPreviewOpen}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>{previewTitle}</DialogTitle>
 </DialogHeaofr>
 <div
 className="prose prose-sm max-w-none border rounded-lg p-6 bg-white"
 dangerorslySandInnerHTML={{ __html: previewContent }}
 />
 </DialogContent>
 </Dialog>
 </div>
 )
}
