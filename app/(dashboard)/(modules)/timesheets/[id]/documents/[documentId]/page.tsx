"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  Download,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TimesheetDocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const timesheetId = params.id as string;
  const documentId = params.documentId as string;

  const { data: timesheet, isLoading: isLoadingTimesheet } = api.timesheet.getById.useQuery(
    { id: timesheetId },
    { enabled: !!timesheetId }
  );

  // Find the document in the timesheet data
  const document = (timesheet as any)?.documents?.find((doc: any) => doc.id === documentId);

  const handleDownload = async () => {
    if (!document) return;
    
    try {
      const link = window.document.createElement("a");
      link.href = document.fileUrl;
      link.download = document.fileName;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
      toast.success("Download started");
    } catch (err) {
      toast.error("Failed to download document");
    }
  };

  // Loading state
  if (isLoadingTimesheet) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!document) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/timesheets/${timesheetId}`} className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Timesheet
            </Link>
          </div>

          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <p>Document not found</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/timesheets/${timesheetId}`}>Back to Timesheet</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Get file type for display
  const fileExtension = document.fileName.split('.').pop()?.toLowerCase();
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/timesheets/${timesheetId}`} className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Timesheet
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <FileText className="h-8 w-8 mt-1 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{document.fileName}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {(document.fileSize / 1024).toFixed(1)} KB • 
                Uploaded on {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
              {document.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {document.description}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isPDF ? (
            <div className="w-full h-[800px] border rounded-lg overflow-hidden">
              <iframe
                src={document.fileUrl}
                className="w-full h-full"
                title={document.fileName}
              />
            </div>
          ) : isImage ? (
            <div className="w-full flex justify-center items-center bg-muted/30 rounded-lg p-8">
              <img
                src={document.fileUrl}
                alt={document.fileName}
                className="max-w-full max-h-[800px] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <p className="mb-4">
                  Preview is not available for this file type. Please download the file to view it.
                </p>
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href={`/timesheets/${timesheetId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Timesheet
          </Link>
        </Button>
      </div>
    </div>
  );
}
