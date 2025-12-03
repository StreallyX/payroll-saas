"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentCard } from "./DocumentCard";
import { Loader2 } from "lucide-react";
import { useContractDocuments } from "@/hooks/contracts/useContractDocuments";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

interface DocumentListProps {
  contractId: string;
  canDelete?: boolean;
}

export function DocumentList({ contractId, canDelete = false }: DocumentListProps) {
  const { documents, isLoading, deleteDocument, isDeleting } = useContractDocuments(contractId);
  const utils = api.useUtils();

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const res = await utils.document.getSignedUrl.fetch({
        documentId,
        download: true,
      });

      if (!res?.url) {
        toast.error("Impossible d'obtenir l'URL du document");
        return;
      }

      const link = document.createElement("a");
      link.href = res.url;
      link.download = fileName ?? "document";
      link.target = "_blank";
      link.rel = "noopener";
      link.click();

      toast.success("Téléchargement lancé");
    } catch (err) {
      toast.error("Erreur lors du téléchargement");
    }
  };


  const handleDelete = (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }
    
    deleteDocument(
      { documentId },
      {
        onSuccess: () => {
          toast.success("Document supprimé avec succès");
        },
        onError: (error: any) => {
          toast.error(error.message || "Échec de la suppression du document");
        },
      }
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Documents partagés ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun document partagé pour ce contrat
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((document: any) => (
              <DocumentCard
                key={document.id}
                document={document}
                onDownload={() => handleDownload(document.document.id, document.document.fileName)}
                onDelete={canDelete ? () => handleDelete(document.id) : undefined}
                isDeleting={isDeleting}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
