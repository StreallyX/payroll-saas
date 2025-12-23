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
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Animated Hero Card with Gradient Background */}
          <Card className="relative overflow-hidden border-none shadow-2xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10"></div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <CardContent className="relative p-12 md:p-16 flex flex-col items-center text-center space-y-8">
              {/* Icon with Animated Ring */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110 duration-300">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
              </div>

              {/* Title with Gradient Text */}
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome! Let's Get Started
                </h1>
                <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Begin your onboarding journey to unlock all platform features. 
                Complete the required steps and you'll be all set!
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-2 text-sm font-medium border border-blue-200">
                  ✨ Quick Setup
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-4 py-2 text-sm font-medium border border-purple-200">
                  📋 Simple Steps
                </Badge>
                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 px-4 py-2 text-sm font-medium border border-pink-200">
                  🚀 Fast Activation
                </Badge>
              </div>

              {/* CTA Button */}
              <Button 
                size="lg" 
                className="mt-8 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 duration-300 border-0"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Starting Your Journey...
                  </>
                ) : (
                  <>
                    🚀 Start My Onboarding
                  </>
                )}
              </Button>

              {/* Info Text */}
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-4">
                Takes only a few minutes to complete
              </p>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card className="mt-6 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Process</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Complete in minutes</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Simple Steps</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Easy to follow</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Circle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Full Access</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unlock all features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
    try {
      setLoadingFile(filePath);
      toast.info("Generating secure link...");
      
      // Call the API route to get a signed URL
      const response = await fetch(`/api/files/view?filePath=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate file URL");
      }
      
      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error("Invalid response from server");
      }
      
      // Open the signed URL in a new window
      const newWindow = window.open(data.url, "_blank");
      
      if (!newWindow) {
        toast.warning("Please allow pop-ups to view the file");
        
        // Fallback: Try to create a download link
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.success("File opened in new tab");
      }
    } catch (err: any) {
      console.error("Error viewing file:", err);
      toast.error(err.message || "Failed to open file");
    } finally {
      setLoadingFile(null);
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
