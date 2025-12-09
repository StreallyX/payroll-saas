"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TimesheetFileViewerProps {
  fileUrl: string | null;
  fileName?: string;
  fileType: "timesheet" | "expense";
  className?: string;
}

/**
 * File viewer component for timesheet and expense files
 * Displays previews for PDFs and images, with download functionality
 */
export function TimesheetFileViewer({
  fileUrl,
  fileName = "document",
  fileType,
  className,
}: TimesheetFileViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!fileUrl) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No {fileType === "timesheet" ? "timesheet" : "expense"} file attached
        </AlertDescription>
      </Alert>
    );
  }

  const isPDF = fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `${fileType}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("[TimesheetFileViewer] Download error:", error);
      toast.error("Error downloading file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewInNewTab = () => {
    window.open(fileUrl, "_blank");
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileText
              className={cn(
                "h-8 w-8 mt-1 flex-shrink-0",
                fileType === "timesheet" ? "text-blue-600" : "text-green-600"
              )}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {fileType === "timesheet" ? "Timesheet Document" : "Expense Receipts"}
              </CardTitle>
              <CardDescription className="mt-1">
                {fileType === "timesheet" 
                  ? "Uploaded timesheet file" 
                  : "Uploaded expense receipts"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewInNewTab}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Preview Area */}
        <div className="rounded-lg border overflow-hidden bg-muted/10">
          {isPDF ? (
            // PDF Preview using iframe
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading document...</p>
                  </div>
                </div>
              )}
              <iframe
                src={fileUrl}
                className="w-full h-[500px] border-0"
                title={fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setImageError(true);
                }}
              />
            </div>
          ) : isImage ? (
            // Image Preview
            <div className="flex items-center justify-center p-4 bg-muted/5">
              {imageError ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Unable to load image preview
                    <br />
                    <span className="text-xs">Click "View" or "Download" to access the file</span>
                  </p>
                </div>
              ) : (
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-[500px] object-contain rounded"
                  onError={() => setImageError(true)}
                  onLoad={() => setIsLoading(false)}
                />
              )}
            </div>
          ) : (
            // Fallback for other file types
            <div className="h-[500px] flex flex-col items-center justify-center gap-3 bg-muted/20">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Preview not available for this file type
                <br />
                <span className="text-xs">Click "View" or "Download" to access the file</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
