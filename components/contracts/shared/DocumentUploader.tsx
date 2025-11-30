"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useContractDocuments } from "@/hooks/contracts/useContractDocuments";
import { toast } from "sonner";

interface DocumentUploaderProps {
  contractId: string;
  onSuccess?: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: "Contract", label: "Contrat" },
  { value: "Invoice", label: "Facture" },
  { value: "ID Document", label: "Pièce d'identité" },
  { value: "Signature", label: "Signature" },
  { value: "Other", label: "Autre" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function DocumentUploader({ contractId, onSuccess }: DocumentUploaderProps) {
  const { uploadDocument, isUploading } = useContractDocuments(contractId);
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [notes, setNotes] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validation de la taille
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Veuillez fournir une description");
      return;
    }
    
    try {
      // Convertir le fichier en base64
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target?.result as string;
        const pdfBuffer = base64.split(",")[1]; // Enlever le préfixe "data:application/pdf;base64,"
        
        uploadDocument(
          {
            contractId,
            pdfBuffer: pdfBuffer!,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            description: description.trim(),
            category,
            notes: notes.trim() || undefined,
          },
          {
            onSuccess: () => {
              toast.success("Document uploadé avec succès");
              // Réinitialiser le formulaire
              setFile(null);
              setDescription("");
              setCategory("Other");
              setNotes("");
              // Réinitialiser l'input file
              const fileInput = document.getElementById("file-upload") as HTMLInputElement;
              if (fileInput) fileInput.value = "";
              
              onSuccess?.();
            },
            onError: (error: any) => {
              toast.error(error.message || "Échec de l'upload du document");
            },
          }
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Échec de la lecture du fichier");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Uploader un document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Fichier *</Label>
          <Input
            id="file-upload"
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              Fichier sélectionné: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
            placeholder="Ex: Facture du mois de novembre"
            disabled={isUploading}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 caractères
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select value={category} onValueChange={setCategory} disabled={isUploading}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Sélectionnez une catégorie" />
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
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Instructions ou informations supplémentaires..."
            disabled={isUploading}
            maxLength={1000}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {notes.length}/1000 caractères
          </p>
        </div>
        
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file || !description.trim()}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Uploader le document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
