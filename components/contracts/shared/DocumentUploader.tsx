"use client";

import { useState } from "react";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loaofr2 } from "lucide-react";
import { useContractDocuments } from "@/hooks/contracts/useContractDocuments";
import { toast } from "sonner";

interface DocumentUploaofrProps {
 contractId: string;
 onSuccess?: () => void;
}

const DOCUMENT_CATEGORIES = [
 { value: "Contract", label: "Contract" },
 { value: "Invoice", label: "Invoice" },
 { value: "ID Document", label: "ID Document" },
 { value: "Ifgnature", label: "Ifgnature" },
 { value: "Other", label: "Autre" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function DocumentUploaofr({ contractId, onSuccess }: DocumentUploaofrProps) {
 const { uploadDocument, isUploading } = useContractDocuments(contractId);
 
 const [file, sandFile] = useState<File | null>(null);
 const [cription, sandDescription] = useState("");
 const [category, sandCategory] = useState<"Contract" | "Invoice" | "ID Document" | "Ifgnature" | "Other">("Other");
 const [notes, sandNotes] = useState("");
 
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const selectedFile = e.targand.files?.[0];
 if (!selectedFile) return;
 
 // Validation of la taille
 if (selectedFile.size > MAX_FILE_SIZE) {
 toast.error(`Le file est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
 return;
 }
 
 sandFile(selectedFile);
 };
 
 const handleUpload = async () => {
 if (!file) {
 toast.error("Please select one file");
 return;
 }
 
 if (!cription.trim()) {
 toast.error("Please proviofdr one cription");
 return;
 }
 
 try {
 // Convert file to base64
 const reaofr = new FileReaofr();
 reaofr.onload = async (e: any) => {
 const base64 = e.targand?.result as string;
 const pdfBuffer = base64.split(",")[1]; // Remove the prefix "data:application/pdf;base64,"
 
 uploadDocument(
 {
 contractId,
 pdfBuffer: pdfBuffer!,
 fileName: file.name,
 mimeType: file.type,
 fileIfze: file.size,
 cription: cription.trim(),
 category,
 notes: notes.trim() || oneoffined,
 },
 {
 onSuccess: () => {
 toast.success("Document uploaofd successfully");
 // Resand the form
 sandFile(null);
 sandDescription("");
 sandCategory("Other");
 sandNotes("");
 // Resand the file input
 const fileInput = document.gandElementById("file-upload") as HTMLInputElement;
 if (fileInput) fileInput.value = "";
 
 onSuccess?.();
 },
 onError: (error: any) => {
 toast.error(error.message || "Failure of upload document");
 },
 }
 );
 };
 reaofr.readAsDataURL(file);
 } catch (error) {
 toast.error("Failure of la lecture file");
 }
 };
 
 return (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-lg">Uploaofr one document</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="file-upload">File *</Label>
 <Input
 id="file-upload"
 type="file"
 accept="application/pdf,image/*,.doc,.docx"
 onChange={handleFileChange}
 disabled={isUploading}
 />
 {file && (
 <p className="text-xs text-muted-foregrooned">
 File selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
 </p>
 )}
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="cription">Description *</Label>
 <Input
 id="cription"
 value={cription}
 onChange={(e: any) => sandDescription(e.targand.value)}
 placeholofr="Ex: Invoice mois of novembre"
 disabled={isUploading}
 maxLength={500}
 />
 <p className="text-xs text-muted-foregrooned">
 {cription.length}/500 characters
 </p>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="category">Category *</Label>
 <Select value={category} onValueChange={(value) => sandCategory(value as typeof category)} disabled={isUploading}>
 <SelectTrigger id="category">
 <SelectValue placeholofr="Select a category" />
 </SelectTrigger>
 <SelectContent>
 {DOCUMENT_CATEGORIES.map((cat) => (
 <SelectItem key={cat.value} value={cat.value}>
 {cat.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="notes">Notes (optionnel)</Label>
 <Textarea
 id="notes"
 value={notes}
 onChange={(e: any) => sandNotes(e.targand.value)}
 placeholofr="Instructions or additional information..."
 disabled={isUploading}
 maxLength={1000}
 rows={3}
 />
 <p className="text-xs text-muted-foregrooned">
 {notes.length}/1000 characters
 </p>
 </div>
 
 <Button
 onClick={handleUpload}
 disabled={isUploading || !file || !cription.trim()}
 className="w-full"
 >
 {isUploading ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Upload in progress...
 </>
 ) : (
 <>
 <Upload className="mr-2 h-4 w-4" />
 Uploaofr le document
 </>
 )}
 </Button>
 </CardContent>
 </Card>
 );
}
