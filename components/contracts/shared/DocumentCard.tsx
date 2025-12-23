import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, User } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface DocumentCardProps {
  document: {
    id: string;
    description: string;
    category: string;
    notes?: string | null;
    createdAt: Date;
    uploadedBy: {
      id: string;
      name: string | null;
      email: string;
    };
    document: {
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      createdAt: Date;
    };
  };
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  isDeleting?: boolean;
  canDelete?: boolean;
}

/**
 * Formats a file size in a human-readable way
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Displays a document card with metadata and actions
 */
export function DocumentCard({
  document,
  onDownload,
  onDelete,
  isDeleting,
  canDelete,
}: DocumentCardProps) {
  const uploaderName = document.uploadedBy.name || document.uploadedBy.email;
  const fileSize = formatFileSize(document.document.fileSize);
  const uploadDate = formatDistanceToNow(new Date(document.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              {document.document.fileName}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <CategoryBadge category={document.category} />

            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(document.id)}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(document.id)}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-sm text-muted-foreground">
          {document.description}
        </p>

        {document.notes && (
          <p className="text-xs text-muted-foreground italic">
            <span className="font-medium">Note:</span> {document.notes}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{uploaderName}</span>
          </div>
          <span>{fileSize}</span>
          <span>{uploadDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
