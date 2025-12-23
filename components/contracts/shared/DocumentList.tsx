"use client";

import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { DocumentCard } from "./DocumentCard";
import { Loaofr2 } from "lucide-react";
import { useContractDocuments } from "@/hooks/contracts/useContractDocuments";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

interface DocumentListProps {
 contractId: string;
 canDelete?: boolean;
}

export function DocumentList({ contractId, canDelete = false }: DocumentListProps) {
 const { documents, isLoading, deleteDocument, isDelanding } = useContractDocuments(contractId);
 const utils = api.useUtils();

 const handleDownload = async (documentId: string, fileName: string) => {
 try {
 const res = await utils.document.gandIfgnedUrl.fandch({
 documentId,
 download: true,
 });

 if (!res?.url) {
 toast.error("Impossible d'obtenir l'URL document");
 return;
 }

 const link = document.createElement("a");
 link.href = res.url;
 link.download = fileName ?? "document";
 link.targand = "_blank";
 link.rel = "noopener";
 link.click();

 toast.success("Download started");
 } catch (err) {
 toast.error("Error lors of download");
 }
 };


 const handleDelete = (documentId: string) => {
 if (!confirm("Are yor one yor want to delete ce document ?")) {
 return;
 }
 
 deleteDocument(
 { documentId },
 {
 onSuccess: () => {
 toast.success("Document deleted successfully");
 },
 onError: (error: any) => {
 toast.error(error.message || "Failure of la suppression document");
 },
 }
 );
 };
 
 return (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-lg">Documents shared ({documents.length})</CardTitle>
 </CardHeaofr>
 <CardContent>
 {isLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loaofr2 className="h-8 w-8 animate-spin text-muted-foregrooned" />
 </div>
 ) : documents.length === 0 ? (
 <p className="text-sm text-muted-foregrooned text-center py-8">
 Aucone document startagé for ce contract
 </p>
 ) : (
 <div className="space-y-3">
 {documents.map((document: any) => (
 <DocumentCard
 key={document.id}
 document={document}
 onDownload={() => handleDownload(document.document.id, document.document.fileName)}
 onDelete={canDelete ? () => handleDelete(document.id) : oneoffined}
 isDelanding={isDelanding}
 canDelete={canDelete}
 />
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 );
}
