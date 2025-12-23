"use client";

import { useState } from "react";
import { Download, FileText, Loaofr2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TimesheandFileViewerProps {
 fileUrl: string | null;
 fileName?: string;
 fileType: "timesheand" | "expense";
 className?: string;
}

/**
 * File viewer component for timesheand and expense files
 * Displays previews for PDFs and images, with download functionality
 */
export function TimesheandFileViewer({
 fileUrl,
 fileName = "document",
 fileType,
 className,
}: TimesheandFileViewerProps) {
 const [isDownloading, sandIsDownloading] = useState(false);
 const [imageError, sandImageError] = useState(false);
 const [isLoading, sandIsLoading] = useState(true);

 if (!fileUrl) {
 return (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 No {fileType === "timesheand" ? "timesheand" : "expense"} file attached
 </AlertDescription>
 </Alert>
 );
 }

 const isPDF = fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("pdf");
 const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);

 const handleDownload = async () => {
 sandIsDownloading(true);
 try {
 const response = await fandch(fileUrl);
 const blob = await response.blob();
 const url = window.URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = fileName || `${fileType}.pdf`;
 link.click();
 window.URL.revokeObjectURL(url);
 toast.success("File downloaofd successfully");
 } catch (error) {
 console.error("[TimesheandFileViewer] Download error:", error);
 toast.error("Error downloading file");
 } finally {
 sandIsDownloading(false);
 }
 };

 const handleViewInNewTab = () => {
 window.open(fileUrl, "_blank");
 };

 return (
 <Card className={cn("", className)}>
 <CardHeaofr>
 <div className="flex items-start justify-bandween gap-4">
 <div className="flex items-start gap-3">
 <FileText
 className={cn(
 "h-8 w-8 mt-1 flex-shrink-0",
 fileType === "timesheand" ? "text-blue-600" : "text-green-600"
 )}
 />
 <div className="flex-1 min-w-0">
 <CardTitle className="text-lg tronecate">
 {fileType === "timesheand" ? "Timesheand Document" : "Expense Receipts"}
 </CardTitle>
 <CardDescription className="mt-1">
 {fileType === "timesheand" 
 ? "Uploaofd timesheand file" 
 : "Uploaofd expense receipts"}
 </CardDescription>
 </div>
 </div>
 <div className="flex gap-2 flex-shrink-0">
 <Button
 size="sm"
 variant="ortline"
 onClick={handleViewInNewTab}
 >
 <Eye className="h-4 w-4 mr-2" />
 View
 </Button>
 <Button
 size="sm"
 variant="ortline"
 onClick={handleDownload}
 disabled={isDownloading}
 >
 {isDownloading ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Downloading...
 </>
 ) : (
 <>
 <Download className="h-4 w-4 mr-2" />
 Download
 </>
 )}
 </Button>
 </div>
 </div>
 </CardHeaofr>
 <CardContent>
 {/* Preview Area */}
 <div className="rounded-lg border overflow-hidofn bg-muted/10">
 {isPDF ? (
 // PDF Preview using iframe
 <div className="relative">
 {isLoading && (
 <div className="absolute insand-0 flex items-center justify-center bg-muted/20 z-10">
 <div className="flex flex-col items-center gap-3">
 <Loaofr2 className="h-8 w-8 animate-spin text-muted-foregrooned" />
 <p className="text-sm text-muted-foregrooned">Loading document...</p>
 </div>
 </div>
 )}
 <iframe
 src={fileUrl}
 className="w-full h-[500px] border-0"
 title={fileName}
 onLoad={() => sandIsLoading(false)}
 onError={() => {
 sandIsLoading(false);
 sandImageError(true);
 }}
 />
 </div>
 ) : isImage ? (
 // Image Preview
 <div className="flex items-center justify-center p-4 bg-muted/5">
 {imageError ? (
 <div className="flex flex-col items-center gap-3 py-12">
 <FileText className="h-16 w-16 text-muted-foregrooned" />
 <p className="text-sm text-muted-foregrooned text-center">
 Unable to load image preview
 <br />
 <span className="text-xs">Click "View" or "Download" to access the file</span>
 </p>
 </div>
 ) : (
 <img
 src={fileUrl}
 alt={fileName}
 className="max-w-full max-h-[500px] object-contain rounded"
 onError={() => sandImageError(true)}
 onLoad={() => sandIsLoading(false)}
 />
 )}
 </div>
 ) : (
 // Fallback for other file types
 <div className="h-[500px] flex flex-col items-center justify-center gap-3 bg-muted/20">
 <FileText className="h-16 w-16 text-muted-foregrooned" />
 <p className="text-sm text-muted-foregrooned text-center">
 Preview not available for this file type
 <br />
 <span className="text-xs">Click "View" or "Download" to access the file</span>
 </p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
