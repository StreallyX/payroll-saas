"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

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
 * Viewer de document PDF avec affichage et téléchargement
 */
export function ContractDocumentViewer({
  document,
  onDownload,
  className,
}: ContractDocumentViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const utils = api.useUtils();

  // Récupérer l'URL signée du document
  const { data: signedUrlData, isLoading: isLoadingUrl } = api.document.getSignedUrl.useQuery(
    { documentId: document.id, download: false },
    { 
      enabled: !!document.id,
      staleTime: 1000 * 60 * 50, // 50 minutes (les URLs S3 expirent après 1h)
    }
  );

  useEffect(() => {
    if (signedUrlData?.url) {
      setPdfUrl(signedUrlData.url);
    }
  }, [signedUrlData]);

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
      const res = await utils.document.getSignedUrl.fetch({
        documentId: document.id,
        download: true, // 🔥 force le download
      });

      if (!res.url) {
        toast.error("URL du document non disponible");
        return;
      }

      const link = window.document.createElement("a");
      link.href = res.url;
      link.download = document.fileName;
      link.target = "_blank";
      link.click();

      toast.success("Document téléchargé avec succès");

      if (onDownload) await onDownload();
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

        {/* Zone de prévisualisation du PDF */}
        <div className="rounded-lg border overflow-hidden">
          {isLoadingUrl ? (
            <div className="h-[600px] flex items-center justify-center bg-muted/20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chargement du document...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border-0"
              title={document.fileName}
            />
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center gap-3 bg-muted/20">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Impossible de charger le document
                <br />
                <span className="text-xs">Veuillez réessayer ou télécharger le fichier</span>
              </p>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le PDF
              </Button>
            </div>
          )}
        </div>

        {/* Actions supplémentaires */}
        {pdfUrl && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, "_blank")}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
