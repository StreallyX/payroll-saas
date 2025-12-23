"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Upload, FileText, AlertCircle, XCircle, Clock, Eye } from "lucide-react";
import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { toast } from "sonner";
import { downloadFile } from "@/lib/s3";

export default function MyOnboardingPage() {
  const { data, isLoading, refetch } = api.onboarding.getMyOnboardingResponses.useQuery();

  const startMutation = api.onboarding.startOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Onboarding started!");
      refetch();
    },
  });

  const submitMutation = api.onboarding.submitResponse.useMutation({
    onSuccess: () => {
      toast.success("Response submitted successfully!");
      refetch();
      setOpenTextModal(false);
      setOpenFileModal(false);
      setCurrentQuestion(null);
      setTextValue("");
      setFile(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [openTextModal, setOpenTextModal] = useState(false);
  const [openFileModal, setOpenFileModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [textValue, setTextValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Loading your onboarding..." />;

  // NO ONBOARDING STARTED
  if (!data || !data.onboardingTemplate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Onboarding"
          description="Start your onboarding process to activate your account"
        />

        <Card className="p-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold">No Onboarding Found</h2>
          <p className="text-muted-foreground max-w-md">
            You need to start your onboarding process before you can access the full platform features.
          </p>

          <Button 
            size="lg" 
            className="mt-4" 
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? "Starting..." : "🚀 Start Onboarding"}
          </Button>
        </Card>
      </div>
    );
  }

  // ONBOARDING EXISTS
  const template = data.onboardingTemplate;
  const responses = data.onboardingResponses || [];

  const totalQuestions = template.questions.length;
  const approvedCount = responses.filter((r) => r.status === "approved").length;
  const pendingCount = responses.filter((r) => r.status === "pending").length;
  const rejectedCount = responses.filter((r) => r.status === "rejected").length;
  const notSubmittedCount = totalQuestions - responses.filter(r => r.responseText || r.responseFilePath).length;
  const progress = totalQuestions > 0 ? Math.round((approvedCount / totalQuestions) * 100) : 0;

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    if (status === "pending") return <Clock className="h-6 w-6 text-yellow-600" />;
    if (status === "rejected") return <XCircle className="h-6 w-6 text-red-600" />;
    return <Circle className="h-6 w-6 text-gray-300" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending Review</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
    return <Badge variant="outline" className="text-gray-500">Not Submitted</Badge>;
  };

  const openTextResponse = (q: any, existingResponse?: any) => {
    setCurrentQuestion(q);
    setTextValue(existingResponse?.responseText || "");
    setOpenTextModal(true);
  };

  const openFileResponse = (q: any) => {
    setCurrentQuestion(q);
    setFile(null);
    setOpenFileModal(true);
  };

  const handleSubmitText = () => {
    if (!textValue.trim()) return toast.error("Please provide an answer");
    
    submitMutation.mutate({
      questionId: currentQuestion.id,
      responseText: textValue,
    });
  };

  const handleSubmitFile = async () => {
    if (!file) return toast.error("Please select a file");
    if (!data?.id || !currentQuestion?.id) return toast.error("Missing required information");

    try {
      setUploading(true);
      toast.info("Uploading file...");

      // Upload to S3 via API route with organized path structure
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "onboarding");
      formData.append("userId", data.id); // Include userId for organized path
      formData.append("questionId", currentQuestion.id); // Include questionId for organized path

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();

      // Submit with S3 path
      submitMutation.mutate({
        questionId: currentQuestion.id,
        responseFilePath: uploadData.cloud_storage_path,
      });
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = async (filePath: string) => {
    console.log("=== HANDLE VIEW FILE START ===");
    console.log("1. Button clicked!");
    console.log("2. File path received:", filePath);
    console.log("3. File path type:", typeof filePath);
    console.log("4. File path length:", filePath?.length);
    
    try {
      console.log("5. Setting loading state...");
      setLoadingFile(filePath);
      
      console.log("6. Showing toast notification...");
      toast.info("Generating secure link...");
      
      console.log("7. Calling downloadFile function...");
      console.log("   - Input path:", filePath);
      
      const url = await downloadFile(filePath);
      
      console.log("8. Signed URL generated successfully!");
      console.log("   - URL:", url);
      console.log("   - URL length:", url?.length);
      
      console.log("9. Opening URL in new window...");
      const newWindow = window.open(url, "_blank");
      
      console.log("10. Window.open result:", newWindow);
      
      if (!newWindow) {
        console.warn("11. Pop-up blocked!");
        toast.warning("Please allow pop-ups to view the file");
        
        // Fallback: Try to create a download link
        console.log("12. Creating fallback download link...");
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("13. Fallback link clicked");
      } else {
        console.log("11. File opened successfully in new tab");
        toast.success("File opened in new tab");
      }
    } catch (err: any) {
      console.error("=== ERROR IN HANDLE VIEW FILE ===");
      console.error("Error object:", err);
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      toast.error("Failed to open file: " + (err.message || "Unknown error"));
    } finally {
      console.log("14. Clearing loading state...");
      setLoadingFile(null);
      console.log("=== HANDLE VIEW FILE END ===");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Onboarding"
        description="Complete your onboarding process and upload required documents"
      />

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                {approvedCount} of {totalQuestions} items approved
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{progress}%</div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-3" />
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-xs text-green-700">Approved</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-xs text-yellow-700">Pending</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-xs text-red-700">Rejected</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{notSubmittedCount}</div>
              <div className="text-xs text-gray-700">Not Submitted</div>
            </div>
          </div>

          {/* Completion Message */}
          {progress === 100 && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Congratulations! Your onboarding is complete. All items have been approved.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Required Information</CardTitle>
          <CardDescription>
            Please provide all requested information and documents
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {template.questions.map((q: any, index: number) => {
            const response = responses.find((x) => x.questionId === q.id);
            const isRejected = response?.status === "rejected";
            const isPending = response?.status === "pending";
            const isApproved = response?.status === "approved";
            const hasResponse = response?.responseText || response?.responseFilePath;

            return (
              <div 
                key={q.id} 
                className={`border rounded-lg p-5 transition-all ${
                  isRejected ? "border-red-300 bg-red-50" : 
                  isPending ? "border-yellow-300 bg-yellow-50" : 
                  isApproved ? "border-green-300 bg-green-50" : 
                  "border-gray-200"
                }`}
              >
                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(response?.status || "missing")}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Question Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {index + 1}. {q.questionText}
                          </h3>
                          {q.isRequired && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Type: {q.questionType === "text" ? "Text Answer" : "File Upload"}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(response?.status || "missing")}
                      </div>
                    </div>

                    {/* Rejection Alert */}
                    {isRejected && response?.adminNotes && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {response.adminNotes}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Existing Response Display */}
                    {hasResponse && (
                      <div className="bg-white p-3 rounded border">
                        {response?.responseText && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Your Answer:</p>
                            <p className="mt-1 text-gray-900">{response.responseText}</p>
                          </div>
                        )}

                        {response?.responseFilePath && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">File uploaded</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewFile(response.responseFilePath!)}
                              disabled={loadingFile === response.responseFilePath}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {loadingFile === response.responseFilePath ? "Loading..." : "View File"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {/* For rejected or not submitted items */}
                      {(isRejected || !hasResponse) && (
                        <>
                          {q.questionType === "text" && (
                            <Button 
                              size="sm" 
                              onClick={() => openTextResponse(q, response)}
                              className={isRejected ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              {isRejected ? "Resubmit Answer" : "Provide Answer"}
                            </Button>
                          )}

                          {q.questionType === "file" && (
                            <Button 
                              size="sm" 
                              onClick={() => openFileResponse(q)}
                              className={isRejected ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isRejected ? "Reupload File" : "Upload File"}
                            </Button>
                          )}
                        </>
                      )}

                      {/* For pending items - allow modification */}
                      {isPending && (
                        <>
                          {q.questionType === "text" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openTextResponse(q, response)}
                            >
                              Edit Answer
                            </Button>
                          )}

                          {q.questionType === "file" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openFileResponse(q)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Replace File
                            </Button>
                          )}
                        </>
                      )}

                      {/* Approved items - read only but allow viewing */}
                      {isApproved && response?.responseFilePath && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewFile(response.responseFilePath!)}
                          disabled={loadingFile === response.responseFilePath}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {loadingFile === response.responseFilePath ? "Loading..." : "View File"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* TEXT RESPONSE MODAL */}
      <Dialog open={openTextModal} onOpenChange={setOpenTextModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentQuestion?.questionText}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter your answer here..."
              rows={6}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenTextModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitText}
              disabled={!textValue.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Answer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FILE UPLOAD MODAL */}
      <Dialog open={openFileModal} onOpenChange={setOpenFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentQuestion?.questionText}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Accepted formats: PDF, Images, Word documents (Max 10MB)
              </p>
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenFileModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFile}
              disabled={!file || uploading || submitMutation.isPending}
            >
              {uploading || submitMutation.isPending ? "Uploading..." : "Upload & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
