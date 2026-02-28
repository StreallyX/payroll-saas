"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";

import { DocumentViewerModal } from "./DocumentViewerModal";
import { DocumentUploadButton } from "./DocumentUploadButton";
import { DocumentVersionHistory } from "./DocumentVersionHistory";

import {
  Eye,
  Download,
  Trash,
  UploadCloud,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Helper to format category values for display
function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    passport: "Passport",
    utility_bill: "Utility Bill",
    drivers_license: "Drivers License",
    residence_card: "Residence Card",
    medical_insurance: "Medical Insurance Certificate",
    other: "Other",
  };
  return categoryMap[category] || category;
}

export function DocumentList({ entityType, entityId }: { entityType?: string; entityId?: string }) {
  const { data: documents, refetch, isLoading } = api.document.list.useQuery({
    entityType,
    entityId,
    latestOnly: true,
  });

  const deleteMutation = api.document.delete.useMutation();

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [versionDoc, setVersionDoc] = useState<any>(null);
  const utils = api.useUtils();

  async function downloadDocument(id: string) {
    try {
      const res = await utils.document.getSignedUrl.fetch({ documentId: id });
        window.open(res.url, "_blank");
    } catch (e) {
      toast.error("Download failed");
    }
  }

  async function deleteDocument(id: string) {
    try {
      await deleteMutation.mutateAsync({ documentId: id });
      toast.success("Document deleted");
      refetch();
    } catch (e) {
      toast.error("Deletion failed");
    }
  }

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">

      {/* Upload button */}
      <DocumentUploadButton
        entityType={entityType}
        entityId={entityId}
        onUploaded={refetch}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {documents?.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.fileName}</TableCell>
              <TableCell>
                {doc.category ? formatCategory(doc.category) : <span className="text-gray-400">-</span>}
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={doc.description || ""}>
                {doc.description || <span className="text-gray-400">-</span>}
              </TableCell>
              <TableCell>v{doc.version}</TableCell>
              <TableCell>{Math.round(doc.fileSize / 1024)} KB</TableCell>
              <TableCell>{new Date(doc.uploadedAt).toLocaleString()}</TableCell>

              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="ghost" onClick={() => { setSelectedDoc(doc); setShowViewer(true); }}>
                  <Eye className="w-4 h-4" />
                </Button>

                <Button size="icon" variant="ghost" onClick={() => downloadDocument(doc.id)}>
                  <Download className="w-4 h-4" />
                </Button>

                <Button size="icon" variant="ghost" onClick={() => setVersionDoc(doc)}>
                  <History className="w-4 h-4" />
                </Button>

                <DocumentUploadButton
                  parentDocumentId={doc.id}
                  onUploaded={refetch}
                />

                <Button size="icon" variant="ghost" onClick={() => deleteDocument(doc.id)}>
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Viewer */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          open={showViewer}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Versions */}
      {versionDoc && (
        <DocumentVersionHistory
          documentId={versionDoc.id}
          onClose={() => setVersionDoc(null)}
        />
      )}
    </div>
  );
}
