"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Loader2, Eye, Download, History } from "lucide-react";
import { toast } from "sonner";

import { DocumentViewerModal } from "./DocumentViewerModal";
import { DocumentVersionHistory } from "./DocumentVersionHistory";

export function DocumentListView({
  entityType,
  entityId
}: {
  entityType?: string;
  entityId?: string;
}) {
  const { data: documents, isLoading } = api.document.list.useQuery({
    entityType,
    entityId,
    latestOnly: true,
  });

  const utils = api.useUtils();

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);

  const [versionDoc, setVersionDoc] = useState<any>(null);

  async function downloadDocument(id: string) {
    try {
      const res = await utils.document.getSignedUrl.fetch({ documentId: id });
      window.open(res.url, "_blank");
    } catch (e) {
      toast.error("Download failed");
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {documents?.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.fileName}</TableCell>
              <TableCell>v{doc.version}</TableCell>
              <TableCell>{Math.round(doc.fileSize / 1024)} KB</TableCell>
              <TableCell>{doc.uploadedBy}</TableCell>
              <TableCell>
                {new Date(doc.uploadedAt).toLocaleString()}
              </TableCell>

              <TableCell className="text-right space-x-2">
                {/* VIEW */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowViewer(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>

                {/* DOWNLOAD */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => downloadDocument(doc.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>

                {/* VERSIONS */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setVersionDoc(doc)}
                >
                  <History className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* VIEWER MODAL */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          open={showViewer}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* VERSION HISTORY MODAL */}
      {versionDoc && (
        <DocumentVersionHistory
          documentId={versionDoc.id}
          onClose={() => setVersionDoc(null)}
        />
      )}
    </div>
  );
}
