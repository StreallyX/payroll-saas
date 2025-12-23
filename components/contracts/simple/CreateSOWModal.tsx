"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  FileText,
  Info,
  Link as LinkIcon,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import {
  ParticipantPreSelector,
  type ParticipantPreSelection,
} from "../shared/ParticipantPreSelector";

interface CreateSOWModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMSAId?: string;
  onSuccess?: (contractId: string) => void;
}

/**
 * Modal for creating a SOW linked to an MSA
 *
 * Process:
 * 1. Select parent MSA
 * 2. Upload PDF
 * 3. Title is automatically generated
 * 4. SOW contract is created in draft status
 */
export function CreateSOWModal({
  open,
  onOpenChange,
  preselectedMSAId,
  onSuccess,
}: CreateSOWModalProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parentMSAId, setParentMSAId] = useState<string>(
    preselectedMSAId || ""
  );
  const [additionalParticipants, setAdditionalParticipants] =
    useState<ParticipantPreSelection[]>([]);

  // Reset parentMSAId when modal opens with a preselected value
  useEffect(() => {
    if (preselectedMSAId) {
      setParentMSAId(preselectedMSAId);
    }
  }, [preselectedMSAId]);

  // Fetch available MSAs
  const { data: msaList, isLoading: isLoadingMSAs } =
    api.simpleContract.listSimpleContracts.useQuery(
      {
        type: "msa",
        status: "all",
        page: 1,
        pageSize: 100,
      },
      {
        enabled: open, // Load only when the modal is open
      }
    );

  const createMutation =
    api.simpleContract.createSimpleSOW.useMutation({
      onSuccess: (data) => {
        toast.success("SOW created successfully");
        onSuccess?.(data.contract.id as string);
        setPdfFile(null);
        setParentMSAId("");
        onOpenChange(false);
        router.push(`/contracts/simple/${data.contract.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create the SOW");
      },
    });

  /**
   * Submit the form
   */
  const handleSubmit = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!parentMSAId) {
      toast.error("Please select a parent MSA");
      return;
    }

    try {
      // Convert file to base64
      const buffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Prepare participants (remove temporary fields)
      const participants = additionalParticipants.map((p) => ({
        userId: p.userId,
        companyId: p.companyId,
        role: p.role,
      }));

      createMutation.mutate({
        parentMSAId,
        pdfBuffer: base64,
        fileName: pdfFile.name,
        mimeType: "application/pdf",
        fileSize: pdfFile.size,
        additionalParticipants:
          participants.length > 0 ? participants : undefined,
      });
    } catch (error) {
      console.error("[CreateSOWModal] Error:", error);
      toast.error("Error while reading the file");
    }
  };

  /**
   * Close the modal
   */
  const handleClose = () => {
    if (!createMutation.isPending) {
      setPdfFile(null);
      setAdditionalParticipants([]);
      if (!preselectedMSAId) {
        setParentMSAId("");
      }
      onOpenChange(false);
    }
  };

  /**
   * Generate a preview title from the file name
   */
  const getPreviewTitle = (): string => {
    if (!pdfFile) return "";

    return pdfFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  const availableMSAs = msaList?.contracts || [];
  const selectedMSA = availableMSAs.find(
    (msa) => msa.id === parentMSAId
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create a SOW (Statement of Work)
          </DialogTitle>
          <DialogDescription>
            Create a SOW linked to an existing MSA. The title
            will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The SOW will automatically inherit settings from
              its parent MSA.
            </AlertDescription>
          </Alert>

          {/* Parent MSA selection */}
          <div className="space-y-2">
            <Label
              htmlFor="parent-msa"
              className="required flex items-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              Parent MSA *
            </Label>

            <Select
              value={parentMSAId}
              onValueChange={setParentMSAId}
              disabled={
                createMutation.isPending ||
                !!preselectedMSAId ||
                isLoadingMSAs
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an MSA..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingMSAs ? (
                  <SelectItem value="loading" disabled>
                    Loading MSAs...
                  </SelectItem>
                ) : availableMSAs.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No MSAs available
                  </SelectItem>
                ) : (
                  availableMSAs.map((msa) => (
                    <SelectItem key={msa.id} value={msa.id}>
                      {msa.title || "Untitled"} ({msa.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedMSA && (
              <p className="text-xs text-muted-foreground">
                The SOW will be linked to:{" "}
                <strong>
                  {selectedMSA.title || "Untitled"}
                </strong>
              </p>
            )}
          </div>

          {/* PDF upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              PDF document *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Title preview */}
          {pdfFile && (
            <div className="space-y-2">
              <Label>
                Contract title (automatically generated)
              </Label>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                {getPreviewTitle() || "Untitled"}
              </div>
              <p className="text-xs text-muted-foreground">
                You will be able to edit this title after
                creation
              </p>
            </div>
          )}

          {/* Additional participants */}
          <div className="border-t pt-4">
            <ParticipantPreSelector
              participants={additionalParticipants}
              onChange={setAdditionalParticipants}
              showAddButton={true}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !pdfFile ||
              !parentMSAId ||
              createMutation.isPending
            }
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create SOW
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
