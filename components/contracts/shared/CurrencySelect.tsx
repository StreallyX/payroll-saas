"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  value?: string; // currencyId
  onChange: (currencyId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Currency selection component backed by the Currency table
 *
 * Uses the tRPC API to fetch the list of active currencies
 * Displays the currency code and symbol (e.g. "USD ($)")
 */
export function CurrencySelect({
  value,
  onChange,
  label = "Currency",
  required = false,
  disabled = false,
  placeholder = "Select a currency...",
  className,
}: CurrencySelectProps) {
  // Fetch the list of active currencies
  const { data: currencies, isLoading } =
    api.currency.getAll.useQuery(undefined, {
      enabled: !disabled,
    });

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          {label}
          {required && " *"}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
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
          ) : !currencies || currencies.length === 0 ? (
            <SelectItem value="empty" disabled>
              No currencies available
            </SelectItem>
          ) : (
            currencies.map((currency: any) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.code}
                {currency.symbol && (
                  <span className="text-muted-foreground ml-1">
                    ({currency.symbol})
                  </span>
                )}
                {currency.name && (
                  <span className="text-xs text-muted-foreground ml-2">
                    – {currency.name}
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
