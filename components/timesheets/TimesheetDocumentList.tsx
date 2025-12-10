"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTimesheetDocuments } from "@/hooks/timesheets/useTimesheetDocuments";
import { api } from "@/lib/trpc";

interface TimesheetDocumentListProps {
  timesheetId: string;
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    description?: string | null;
    uploadedAt: Date | string;
  }>;
  canDelete?: boolean;
}

/**
 * Component to list timesheet documents with download/delete actions
 * Mirrors the contract DocumentList component
 */
export function TimesheetDocumentList({ 
  timesheetId, 
  documents, 
  canDelete = false 
}: TimesheetDocumentListProps) {
  const { deleteDocument, isDeleting } = useTimesheetDocuments(timesheetId);
  const utils = api.useUtils();

  const handleDownload = async (documentId: string, fileName: string, fileUrl: string) => {
    try {
      // For timesheets, the fileUrl might already be a signed URL
      // Or we might need to get a signed URL from the document service
      // For now, we'll use the fileUrl directly
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();

      toast.success("Download started");
    } catch (err) {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }
    
    deleteDocument(
      { documentId },
      {
        onSuccess: () => {
          toast.success("Document deleted successfully");
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to delete document");
        },
      }
    );
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No documents attached</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {doc.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {(doc.fileSize / 1024).toFixed(1)} KB • 
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
              {doc.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {doc.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(doc.id, doc.fileName, doc.fileUrl)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
