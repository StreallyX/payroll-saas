"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface UserBankSelectProps {
  userId: string;
  value?: string;
  values?: string[]; // For multiple mode
  onChange?: (value: string) => void;
  onChangeMultiple?: (values: string[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
}

/**
 * UserBank / PaymentMethod selection component
 *
 * Supports single and multiple selection modes
 * Loads payment methods for a specific user
 */
export function UserBankSelect({
  userId,
  value,
  values = [],
  onChange,
  onChangeMultiple,
  label = "Payment method",
  required = false,
  disabled = false,
  placeholder = "Select a payment method...",
  multiple = false,
  className,
}: UserBankSelectProps) {
  // Fetch user's payment methods
  // TODO: Implement proper API to fetch user PaymentMethods
  // For now, we use a placeholder list
  const { data: allBanks = [], isLoading } = api.bank.getAll.useQuery(
    undefined,
    {
      enabled: !!userId && !disabled,
    }
  );

  console.log(allBanks);

  // Filter by userId (temporary logic – adapt to real structure)
  const paymentMethods = {
    userBanks: allBanks.filter(
      (bank: any) => bank.userId === userId || !bank.userId
    ),
  };

  // Handle single or multiple selection
  const handleChange = (newValue: string) => {
    if (multiple && onChangeMultiple) {
      // Multiple mode: add if not already selected
      if (!values.includes(newValue)) {
        onChangeMultiple([...values, newValue]);
      }
    } else if (onChange) {
      // Single mode
      onChange(newValue);
    }
  };

  // Remove item in multiple mode
  const handleRemove = (valueToRemove: string) => {
    if (onChangeMultiple) {
      onChangeMultiple(values.filter((v) => v !== valueToRemove));
    }
  };

  if (!userId) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className={cn(required && "required")}>
            <CreditCard className="h-4 w-4 inline mr-1" />
            {label}
            {required && " *"}
          </Label>
        )}
        <div className="text-sm text-muted-foreground">
          Please select a user first
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <CreditCard className="h-4 w-4 inline mr-1" />
          {label}
          {required && " *"}
        </Label>
      )}

      {/* Multiple mode: selected items */}
      {multiple && values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((selectedValue) => {
            const selectedBank = paymentMethods?.userBanks?.find(
              (pm: any) => pm.id === selectedValue
            );
            return (
              <div
                key={selectedValue}
                className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
              >
                <span>
                  {selectedBank?.name || "Payment method"}
                  {selectedBank?.accountNumber &&
                    ` - ${selectedBank.accountNumber.slice(-4)}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => handleRemove(selectedValue)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Select
        value={multiple ? "" : value}
        onValueChange={handleChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Loading...
            </SelectItem>
          ) : !paymentMethods?.userBanks ||
            paymentMethods.userBanks.length === 0 ? (
            <SelectItem value="empty" disabled>
              No payment methods available
            </SelectItem>
          ) : (
            paymentMethods.userBanks
              .filter((pm: any) => !multiple || !values.includes(pm.id))
              .map((pm: any) => (
                <SelectItem key={pm.id} value={pm.id}>
                  {pm.name || "Payment method"}
                  {pm.accountNumber && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (•••• {pm.accountNumber.slice(-4)})
                    </span>
                  )}
                </SelectItem>
              ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
