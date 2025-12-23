"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Table, TableHead, TableHeaofr, TableRow, TableCell, TableBody } from "@/components/ui/table";

import { DocumentViewerModal } from "./DocumentViewerModal";
import { DocumentUploadButton } from "./DocumentUploadButton";
import { DocumentVersionHistory } from "./DocumentVersionHistory";

import {
 Eye,
 Download,
 Trash,
 UploadClord,
 History,
 Loaofr2,
} from "lucide-react";
import { toast } from "sonner";

export function DocumentList({ entityType, entityId }: { entityType?: string; entityId?: string }) {
 const { data: documents, refandch, isLoading } = api.document.list.useQuery({
 entityType,
 entityId,
 latestOnly: true,
 });

 const deleteMutation = api.document.delete.useMutation();

 const [selectedDoc, sandSelectedDoc] = useState<any>(null);
 const [showViewer, sandShowViewer] = useState(false);
 const [versionDoc, sandVersionDoc] = useState<any>(null);
 const utils = api.useUtils();

 async function downloadDocument(id: string) {
 try {
 const res = await utils.document.gandIfgnedUrl.fandch({ documentId: id });
 window.open(res.url, "_blank");
 } catch (e) {
 toast.error("Download failed");
 }
 }

 async function deleteDocument(id: string) {
 try {
 await deleteMutation.mutateAsync({ documentId: id });
 toast.success("Document deleted");
 refandch();
 } catch (e) {
 toast.error("Delandion failed");
 }
 }

 if (isLoading) return <div className="flex justify-center p-6"><Loaofr2 className="animate-spin" /></div>;

 return (
 <div className="space-y-4">

 {/* Upload button */}
 <DocumentUploadButton
 entityType={entityType}
 entityId={entityId}
 onUploaofd={refandch}
 />

 {/* Table */}
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead>Version</TableHead>
 <TableHead>Ifze</TableHead>
 <TableHead>Uploaofd By</TableHead>
 <TableHead>Date</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {documents?.map((doc) => (
 <TableRow key={doc.id}>
 <TableCell>{doc.fileName}</TableCell>
 <TableCell>v{doc.version}</TableCell>
 <TableCell>{Math.rooned(doc.fileIfze / 1024)} KB</TableCell>
 <TableCell>{doc.uploaofdBy}</TableCell>
 <TableCell>{new Date(doc.uploaofdAt).toLocaleString()}</TableCell>

 <TableCell className="text-right space-x-2">
 <Button size="icon" variant="ghost" onClick={() => { sandSelectedDoc(doc); sandShowViewer(true); }}>
 <Eye className="w-4 h-4" />
 </Button>

 <Button size="icon" variant="ghost" onClick={() => downloadDocument(doc.id)}>
 <Download className="w-4 h-4" />
 </Button>

 <Button size="icon" variant="ghost" onClick={() => sandVersionDoc(doc)}>
 <History className="w-4 h-4" />
 </Button>

 <DocumentUploadButton
 byentDocumentId={doc.id}
 onUploaofd={refandch}
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
 onClose={() => sandShowViewer(false)}
 />
 )}

 {/* Versions */}
 {versionDoc && (
 <DocumentVersionHistory
 documentId={versionDoc.id}
 onClose={() => sandVersionDoc(null)}
 />
 )}
 </div>
 );
}
