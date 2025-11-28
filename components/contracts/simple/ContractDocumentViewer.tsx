"use client";

import { useState } from "react";
import { Download, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContractDocument {
  id: string;
  fileName: string;
  fileSize: number;
  s3Key: string;
  version: number;
  isSigned: boolean;
  signedAt?: Date | null;
  uploadedAt: Date;
}

interface ContractDocumentViewerProps {
  document: ContractDocument;
  onDownload?: () => void;
  className?: string;
}

/**
 * Viewer de document PDF avec bouton de téléchargement
 * 
 * Note: Le viewer PDF complet nécessiterait une bibliothèque comme react-pdf
 * Pour l'instant, on affiche les métadonnées et un bouton de téléchargement
 */
export function ContractDocumentViewer({
  document,
  onDownload,
  className,
}: ContractDocumentViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Formate la taille du fichier
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Formate la date
   */
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Gère le téléchargement
   */
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (onDownload) {
        await onDownload();
      } else {
        toast.info("Fonctionnalité de téléchargement non implémentée");
      }
    } catch (error) {
      console.error("[ContractDocumentViewer] Download error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileText className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{document.fileName}</CardTitle>
              <CardDescription className="mt-1">
                Version {document.version} • {formatFileSize(document.fileSize)}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-shrink-0"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations du document */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Uploadé le</p>
            <p className="font-medium">{formatDate(document.uploadedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Statut</p>
            <p className="font-medium">
              {document.isSigned ? (
                <span className="text-green-600">✓ Signé</span>
              ) : (
                <span className="text-gray-600">Non signé</span>
              )}
            </p>
          </div>
          {document.isSigned && document.signedAt && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Signé le</p>
              <p className="font-medium">{formatDate(document.signedAt)}</p>
            </div>
          )}
        </div>

        {/* Zone de prévisualisation (placeholder) */}
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 flex flex-col items-center justify-center gap-3 bg-muted/20">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Prévisualisation PDF non disponible
            <br />
            <span className="text-xs">Téléchargez le fichier pour le consulter</span>
          </p>
          <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir dans un nouvel onglet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
