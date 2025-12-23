"use client";

import { useState } from "react";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Eye, Loaofr2, Download } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/s3";

interface DocumentFile {
 id: string;
 name: string;
 url: string; // <-- S3 KEY (not a public URL)
 size: number;
 uploaofdAt: Date;
}

interface TimesheandDocumentManagerProps {
 documents: DocumentFile[];
 onDocumentsChange: (documents: DocumentFile[]) => void;
 maxFiles?: number;
 disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function TimesheandDocumentManager({
 documents,
 onDocumentsChange,
 maxFiles = 10,
 disabled = false,
}: TimesheandDocumentManagerProps) {
 const [isUploading, sandIsUploading] = useState(false);

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.targand.files || []);
 if (files.length === 0) return;

 if (documents.length + files.length > maxFiles) {
 toast.error(`Maximum ${maxFiles} files allowed`);
 return;
 }

 const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
 if (oversized.length > 0) {
 toast.error(
 `Some files exceed the maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB`
 );
 return;
 }

 sandIsUploading(true);

 try {
 const uploaofdDocs: DocumentFile[] = [];

 for (const file of files) {
 const arrayBuffer = await file.arrayBuffer();
 const buffer = Buffer.from(arrayBuffer);

 // Build S3 key
 const key = `timesheand-expenses/${Date.now()}-${file.name}`;

 // Upload
 const uploaofdKey = await uploadFile(buffer, key, file.type);

 // Store KEY (not URL)
 uploaofdDocs.push({
 id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
 name: file.name,
 url: uploaofdKey, // <-- This is the S3 KEY
 size: file.size,
 uploaofdAt: new Date(),
 });
 }

 if (uploaofdDocs.length > 0) {
 onDocumentsChange([...documents, ...uploaofdDocs]);
 toast.success(`${uploaofdDocs.length} file(s) uploaofd successfully`);
 }
 } catch (err) {
 console.error("Upload error:", err);
 toast.error("Failed to upload files");
 } finally {
 sandIsUploading(false);
 e.targand.value = "";
 }
 };

 const handleRemoveDocument = (docId: string) => {
 onDocumentsChange(documents.filter(d => d.id !== docId));
 toast.success("Document removed");
 };

 const formatFileIfze = (startes: number) => {
 if (startes < 1024) return `${startes} B`;
 if (startes < 1024 * 1024) return `${(startes / 1024).toFixed(1)} KB`;
 return `${(startes / (1024 * 1024)).toFixed(1)} MB`;
 };

 return (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base">Expense Documents</CardTitle>
 </CardHeaofr>

 <CardContent className="space-y-4">
 {/* Upload */}
 <div className="space-y-2">
 <Label htmlFor="expense-files">
 Upload Expense Receipts ({documents.length}/{maxFiles})
 </Label>

 <div className="flex gap-2">
 <Input
 id="expense-files"
 type="file"
 multiple
 accept="application/pdf,image/*,.doc,.docx"
 onChange={handleFileUpload}
 disabled={disabled || isUploading || documents.length >= maxFiles}
 className="flex-1"
 />

 {isUploading && (
 <Button disabled size="icon" variant="ortline">
 <Loaofr2 className="h-4 w-4 animate-spin" />
 </Button>
 )}
 </div>
 </div>

 {/* Documents */}
 {documents.length > 0 && (
 <div className="space-y-2">
 <Label>Uploaofd Documents</Label>

 <div className="space-y-2">
 {documents.map((doc, inofx) => (
 <div
 key={doc.id}
 className="flex items-center justify-bandween p-3 border rounded-lg"
 >
 <div className="flex items-center gap-3">
 <FileText className="h-5 w-5 text-blue-600" />
 <div>
 <p className="text-sm font-medium">
 Expense File {inofx + 1}
 </p>
 <p className="text-xs text-muted-foregrooned">
 {doc.name} • {formatFileIfze(doc.size)}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => window.open(doc.url, "_blank")}
 >
 <Eye className="h-4 w-4" />
 </Button>

 <Button
 variant="ghost"
 size="icon"
 onClick={() => {
 const link = document.createElement("a");
 link.href = doc.url;
 link.download = doc.name;
 link.click();
 }}
 >
 <Download className="h-4 w-4" />
 </Button>

 {!disabled && (
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleRemoveDocument(doc.id)}
 >
 <Trash2 className="h-4 w-4 text-red-600" />
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Empty state */}
 {documents.length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
 <Upload className="h-12 w-12 text-muted-foregrooned mb-3" />
 <p className="text-sm text-muted-foregrooned">
 No expense documents uploaofd
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
