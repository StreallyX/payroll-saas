"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileSignature,
  CheckCircle,
  Info,
  Loader2,
  Calendar,
} from "lucide-react";
import { useNormContract } from "@/hooks/contracts/useNormContract";
import { toast } from "sonner";

interface ContractorSignatureSectionProps {
  contract: {
    id: string;
    title: string | null;
    contractorSignedAt?: Date | string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  };
  onSuccess?: () => void;
}

/**
 * Section allowing the contractor to sign the contract
 *
 * Displays:
 * - Contract information
 * - "Sign contract" button
 * - Confirmation modal with signature date
 * - Signature status (signed or not)
 */
export function ContractorSignatureSection({
  contract,
  onSuccess,
}: ContractorSignatureSectionProps) {
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureDate, setSignatureDate] = useState<string>(
    new Date().toISOString().split("T")[0] // Default to today's date
  );

  const { contractorSignContract, isSigning } = useNormContract();

  const isAlreadySigned = !!contract.contractorSignedAt;

  /**
   * Handle contract signature
   */
  const handleSign = async () => {
    if (!signatureDate) {
      toast.error("Please select a signature date");
      return;
    }

    try {
      await contractorSignContract.mutateAsync({
        contractId: contract.id,
        signatureDate: new Date(signatureDate),
      });
      setShowSignModal(false);
      onSuccess?.();
    } catch (error) {
      console.error(
        "[ContractorSignatureSection] Error:",
        error
      );
    }
  };

  /**
   * Format date
   */
  const formatDate = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <Card
        className={
          isAlreadySigned
            ? "border-green-200 bg-green-50/50"
            : "border-orange-200 bg-orange-50/50"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Contractor Signature
          </CardTitle>
          <CardDescription>
            {isAlreadySigned
              ? "You have already signed this contract"
              : "You must sign this contract to validate it"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contract information */}
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Contract title
              </p>
              <p className="font-medium">
                {contract.title || "NORM Contract"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start date
                </p>
                <p className="font-medium">
                  {formatDate(contract.startDate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  End date
                </p>
                <p className="font-medium">
                  {formatDate(contract.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Signature status */}
          {isAlreadySigned ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>
                  Contract signed on{" "}
                  {formatDate(
                    contract.contractorSignedAt
                  )}
                </strong>
                <br />
                Your signature has been successfully recorded.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-orange-200">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  By signing this contract, you confirm that you
                  have read and accepted all terms and conditions
                  stated in the document.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setShowSignModal(true)}
                className="w-full"
                size="lg"
              >
                <FileSignature className="mr-2 h-5 w-5" />
                Sign contract
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation modal */}
      <Dialog
        open={showSignModal}
        onOpenChange={setShowSignModal}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Confirm signature
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to sign this contract
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Contract information */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Contract
                </p>
                <p className="font-semibold">
                  {contract.title || "NORM Contract"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Start
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(contract.startDate)}
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    End
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Signature date */}
            <div className="space-y-2">
              <Label
                htmlFor="signature-date"
                className="required"
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                Signature date *
              </Label>
              <Input
                id="signature-date"
                type="date"
                value={signatureDate}
                onChange={(e) =>
                  setSignatureDate(e.target.value)
                }
                disabled={isSigning}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                } // No future dates
              />
              <p className="text-xs text-muted-foreground">
                By default, today’s date is selected
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This action is
                final. By signing, you confirm that you have
                read and accepted all terms of the contract.
              </AlertDescription>
            </Alert>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSignModal(false)}
              disabled={isSigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              disabled={isSigning || !signatureDate}
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Confirm signature
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
