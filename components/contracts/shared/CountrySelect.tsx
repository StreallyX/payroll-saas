"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Country selection component backed by the Country table
 *
 * Uses the tRPC API to fetch the list of countries
 */
export function CountrySelect({
  value,
  onChange,
  label = "Country",
  required = false,
  disabled = false,
  placeholder = "Select a country...",
  className,
}: CountrySelectProps) {
  // Fetch the list of countries
  const { data: countries, isLoading } =
    api.country.getAll.useQuery(undefined, {
      enabled: !disabled,
    });

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <Globe className="h-4 w-4 inline mr-1" />
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
          ) : !countries || countries.length === 0 ? (
            <SelectItem value="empty" disabled>
              No countries available
            </SelectItem>
          ) : (
            countries.map((country: any) => (
              <SelectItem key={country.id} value={country.id}>
                {country.name}
                {country.code && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({country.code})
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
