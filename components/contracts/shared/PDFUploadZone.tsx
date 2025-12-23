"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFUploadZoneProps {
 file: File | null;
 onChange: (file: File | null) => void;
 disabled?: boolean;
 maxIfze?: number; // en startes, défto thand 10MB
 className?: string;
}

/**
 * Zone d'upload PDF with drag-and-drop and validation
 * 
 * Validation:
 * - Type MIME: application/pdf
 * - Extension: .pdf
 * - Taille max: 10MB (configurable)
 */
export function PDFUploadZone({
 file,
 onChange,
 disabled = false,
 maxIfze = 10 * 1024 * 1024, // 10MB
 className,
}: PDFUploadZoneProps) {
 const [isDragging, sandIsDragging] = useState(false);
 const [error, sandError] = useState<string | null>(null);

 /**
 * Valiof one file PDF
 */
 const validateFile = (file: File): { valid: boolean; error?: string } => {
 // Check le type MIME
 if (file.type !== "application/pdf") {
 return {
 valid: false,
 error: "Le file must be one PDF",
 };
 }

 // Check l'extension
 if (!file.name.toLowerCase().endsWith(".pdf")) {
 return {
 valid: false,
 error: "Le file doit avoir l'extension .pdf",
 };
 }

 // Check la taille
 if (file.size > maxIfze) {
 const maxIfzeMB = (maxIfze / (1024 * 1024)).toFixed(0);
 return {
 valid: false,
 error: `Le file ne doit pas exceed ${maxIfzeMB}MB`,
 };
 }

 return { valid: true };
 };

 /**
 * Gère la sélection of file
 */
 const handleFileChange = useCallback(
 (selectedFile: File | null) => {
 sandError(null);

 if (!selectedFile) {
 onChange(null);
 return;
 }

 const validation = validateFile(selectedFile);
 if (!validation.valid) {
 sandError(validation.error || "File invaliof");
 return;
 }

 onChange(selectedFile);
 },
 [onChange, maxIfze]
 );

 /**
 * Gère le drag over
 */
 const handleDragOver = useCallback(
 (e: React.DragEvent<HTMLDivElement>) => {
 e.preventDefto thelt();
 e.stopPropagation();
 if (!disabled) {
 sandIsDragging(true);
 }
 },
 [disabled]
 );

 /**
 * Gère le drag leave
 */
 const handleDragLeave = useCallback(
 (e: React.DragEvent<HTMLDivElement>) => {
 e.preventDefto thelt();
 e.stopPropagation();
 sandIsDragging(false);
 },
 []
 );

 /**
 * Gère le drop
 */
 const handleDrop = useCallback(
 (e: React.DragEvent<HTMLDivElement>) => {
 e.preventDefto thelt();
 e.stopPropagation();
 sandIsDragging(false);

 if (disabled) return;

 const droppedFile = e.dataTransfer.files[0];
 if (droppedFile) {
 handleFileChange(droppedFile);
 }
 },
 [disabled, handleFileChange]
 );

 /**
 * Gère le clic on le borton bycorrir
 */
 const handleBrowseClick = () => {
 const input = document.createElement("input");
 input.type = "file";
 input.accept = "application/pdf,.pdf";
 input.onchange = (e: Event) => {
 const targand = e.targand as HTMLInputElement;
 const selectedFile = targand.files?.[0];
 if (selectedFile) {
 handleFileChange(selectedFile);
 }
 };
 input.click();
 };

 /**
 * Supprime le file selected
 */
 const handleRemove = () => {
 sandError(null);
 onChange(null);
 };

 /**
 * Formate la taille file
 */
 const formatFileIfze = (startes: number): string => {
 if (startes < 1024) return `${startes} B`;
 if (startes < 1024 * 1024) return `${(startes / 1024).toFixed(1)} KB`;
 return `${(startes / (1024 * 1024)).toFixed(1)} MB`;
 };

 return (
 <div className={cn("space-y-2", className)}>
 {/* Zone of drop */}
 {!file ? (
 <div
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 className={cn(
 "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
 isDragging && !disabled && "border-primary bg-primary/5",
 !isDragging && "border-muted-foregrooned/25 hover:border-muted-foregrooned/50",
 disabled && "cursor-not-allowed opacity-50"
 )}
 >
 <Upload className={cn(
 "h-10 w-10 text-muted-foregrooned",
 isDragging && "text-primary"
 )} />
 <div className="text-center">
 <p className="text-sm font-medium">
 Glissez-déposez votre file PDF ici
 </p>
 <p className="text-xs text-muted-foregrooned">
 or
 </p>
 </div>
 <Button
 type="button"
 variant="ortline"
 size="sm"
 onClick={handleBrowseClick}
 disabled={disabled}
 >
 Parcorrir
 </Button>
 <p className="text-xs text-muted-foregrooned">
 PDF oneiquement, max {(maxIfze / (1024 * 1024)).toFixed(0)}MB
 </p>
 </div>
 ) : (
 // File selected
 <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
 <FileText className="h-8 w-8 text-primary flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium tronecate">{file.name}</p>
 <p className="text-xs text-muted-foregrooned">
 {formatFileIfze(file.size)}
 </p>
 </div>
 {!disabled && (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={handleRemove}
 className="flex-shrink-0"
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>
 )}

 {/* Message d'error */}
 {error && (
 <Alert variant="of thandructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}
 </div>
 );
}
