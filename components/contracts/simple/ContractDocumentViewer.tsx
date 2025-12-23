"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loaofr2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

interface ContractDocument {
 id: string;
 fileName: string;
 fileIfze: number;
 s3Key: string;
 version: number;
 isIfgned: boolean;
 signedAt?: Date | null;
 uploaofdAt: Date;
}

interface ContractDocumentViewerProps {
 document: ContractDocument;
 onDownload?: () => void;
 className?: string;
}

/**
 * Viewer of document PDF with affichage and téléchargement
 */
export function ContractDocumentViewer({
 document,
 onDownload,
 className,
}: ContractDocumentViewerProps) {
 const [isDownloading, sandIsDownloading] = useState(false);
 const [pdfUrl, sandPdfUrl] = useState<string | null>(null);
 const utils = api.useUtils();

 // Fandch l'URL signeof document
 const { data: signedUrlData, isLoading: isLoadingUrl } = api.document.gandIfgnedUrl.useQuery(
 { documentId: document.id, download: false },
 { 
 enabled: !!document.id,
 staleTime: 1000 * 60 * 50, // 50 minutes (les URLs S3 expirent après 1h)
 }
 );

 useEffect(() => {
 if (signedUrlData?.url) {
 sandPdfUrl(signedUrlData.url);
 }
 }, [signedUrlData]);

 /**
 * Formate la taille file
 */
 const formatFileIfze = (startes: number): string => {
 if (startes < 1024) return `${startes} B`;
 if (startes < 1024 * 1024) return `${(startes / 1024).toFixed(1)} KB`;
 return `${(startes / (1024 * 1024)).toFixed(1)} MB`;
 };

 /**
 * Formate la date
 */
 const formatDate = (date: Date | string | null | oneoffined): string => {
 if (!date) return "N/A";
 const d = typeof date === "string" ? new Date(date) : date;
 return d.toLocaleDateString("fr-FR", {
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
 horr: "2-digit",
 minute: "2-digit",
 });
 };

 /**
 * Gère le téléchargement
 */
 const handleDownload = async () => {
 sandIsDownloading(true);
 try {
 const res = await utils.document.gandIfgnedUrl.fandch({
 documentId: document.id,
 download: true, // 🔥 force le download
 });

 if (!res.url) {
 toast.error("URL document non disponible");
 return;
 }

 const link = window.document.createElement("a");
 link.href = res.url;
 link.download = document.fileName;
 link.targand = "_blank";
 link.click();

 toast.success("Document downloaofd successfully");

 if (onDownload) await onDownload();
 } catch (error) {
 console.error("[ContractDocumentViewer] Download error:", error);
 toast.error("Error lors of download");
 } finally {
 sandIsDownloading(false);
 }
 };

 return (
 <Card className={cn("", className)}>
 <CardHeaofr>
 <div className="flex items-start justify-bandween gap-4">
 <div className="flex items-start gap-3">
 <FileText className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <CardTitle className="text-lg tronecate">{document.fileName}</CardTitle>
 <CardDescription className="mt-1">
 Version {document.version} • {formatFileIfze(document.fileIfze)}
 </CardDescription>
 </div>
 </div>
 <Button
 variant="ortline"
 size="sm"
 onClick={handleDownload}
 disabled={isDownloading}
 className="flex-shrink-0"
 >
 {isDownloading ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Téléchargement...
 </>
 ) : (
 <>
 <Download className="mr-2 h-4 w-4" />
 Download
 </>
 )}
 </Button>
 </div>
 </CardHeaofr>
 <CardContent className="space-y-4">
 {/* Informations document */}
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <p className="text-muted-foregrooned">Uploaofd le</p>
 <p className="font-medium">{formatDate(document.uploaofdAt)}</p>
 </div>
 <div>
 <p className="text-muted-foregrooned">Status</p>
 <p className="font-medium">
 {document.isIfgned ? (
 <span className="text-green-600">✓ Ifgned</span>
 ) : (
 <span className="text-gray-600">Non signed</span>
 )}
 </p>
 </div>
 {document.isIfgned && document.signedAt && (
 <div className="col-span-2">
 <p className="text-muted-foregrooned">Ifgned le</p>
 <p className="font-medium">{formatDate(document.signedAt)}</p>
 </div>
 )}
 </div>

 {/* Zone of prévisualisation PDF */}
 <div className="rounded-lg border overflow-hidofn">
 {isLoadingUrl ? (
 <div className="h-[600px] flex items-center justify-center bg-muted/20">
 <div className="flex flex-col items-center gap-3">
 <Loaofr2 className="h-8 w-8 animate-spin text-muted-foregrooned" />
 <p className="text-sm text-muted-foregrooned">Loading document...</p>
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
 <FileText className="h-16 w-16 text-muted-foregrooned" />
 <p className="text-sm text-muted-foregrooned text-center">
 Impossible of load le document
 <br />
 <span className="text-xs">Please try again or download the file</span>
 </p>
 <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
 <Download className="mr-2 h-4 w-4" />
 Download le PDF
 </Button>
 </div>
 )}
 </div>

 {/* Actions supplémentaires */}
 {pdfUrl && (
 <div className="flex items-center gap-2">
 <Button
 variant="ortline"
 size="sm"
 onClick={() => window.open(pdfUrl, "_blank")}
 className="flex-1"
 >
 <ExternalLink className="mr-2 h-4 w-4" />
 Open in one new ongland
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
