"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MarginDetails {
  marginType: string; // FIXED, VARIABLE, CUSTOM
  marginPercentage?: number;
  marginAmount?: number;
  calculatedMargin?: number;
  isOverridden?: boolean;
  overriddenBy?: string;
  notes?: string;
  contractId?: string;
}

interface MarginConfirmationCardProps {
  marginDetails: MarginDetails;
  baseAmount: number;
  currency: string;
  onConfirmMargin: (overrideAmount?: number, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * MarginConfirmationCard
 * 
 * Displays margin details and allows admin to review and optionally override
 * the margin before confirming and sending the invoice.
 */
export function MarginConfirmationCard({
  marginDetails,
  baseAmount,
  currency,
  onConfirmMargin,
  isLoading = false,
}: MarginConfirmationCardProps) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState<string>("");
  const [notes, setNotes] = useState("");

  const calculatedAmount = marginDetails.calculatedMargin || marginDetails.marginAmount || 0;
  const totalWithMargin = baseAmount + calculatedAmount;

  const handleConfirm = async () => {
    if (isOverriding) {
      const override = parseFloat(overrideAmount);
      if (isNaN(override) || override < 0) {
        toast.error("Please enter a valid margin amount");
        return;
      }
      
      if (!notes.trim()) {
        toast.error("Please provide a reason for overriding the margin");
        return;
      }

      await onConfirmMargin(override, notes.trim());
    } else {
      await onConfirmMargin();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-5 w-5 text-yellow-600" />
          Margin Confirmation Required
        </CardTitle>
        <CardDescription>
          Review the calculated margin before sending this invoice. You can override the margin if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Margin Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Margin Type</span>
            <Badge variant="outline" className="uppercase">
              {marginDetails.marginType}
            </Badge>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Base Amount</span>
            <span className="font-medium">{formatCurrency(baseAmount)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Calculated Margin</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(calculatedAmount)}
              {marginDetails.marginPercentage && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({marginDetails.marginPercentage}%)
                </span>
              )}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Total with Margin</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(totalWithMargin)}
            </span>
          </div>
        </div>

        {/* Override Section */}
        {!isOverriding && !marginDetails.isOverridden && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsOverriding(true)}
            disabled={isLoading}
          >
            Override Margin
          </Button>
        )}

        {isOverriding && (
          <div className="space-y-3 p-4 border rounded-lg bg-white">
            <div className="space-y-2">
              <Label htmlFor="override-amount">Override Margin Amount *</Label>
              <Input
                id="override-amount"
                type="number"
                step="0.01"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(e.target.value)}
                placeholder="Enter new margin amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-notes">Reason for Override *</Label>
              <Input
                id="override-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why you're overriding the margin"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOverriding(false);
                  setOverrideAmount("");
                  setNotes("");
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Override History */}
        {marginDetails.isOverridden && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <p className="text-sm font-medium">Margin was overridden</p>
              {marginDetails.overriddenBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  By: {marginDetails.overriddenBy}
                </p>
              )}
              {marginDetails.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  Reason: {marginDetails.notes}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Confirm Button */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Margin & Continue
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
