"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  roleFilter?: "agency" | "client" | "tenant";
  className?: string;
}

/**
 * Company selection component with role-based filtering
 *
 * Uses the tRPC API to fetch the list of companies
 * Supports filtering by role (agency, client, tenant)
 */
export function CompanySelect({
  value,
  onChange,
  label = "Company",
  required = false,
  disabled = false,
  placeholder = "Select a company...",
  roleFilter,
  className,
}: CompanySelectProps) {
  // Fetch the list of companies
  const { data: companies = [], isLoading } =
    api.company.getAll.useQuery(undefined, {
      enabled: !disabled,
    });

  // Filter by role if needed
  const filteredCompanies = roleFilter
    ? companies.filter((c: any) => c.ownerType === roleFilter)
    : companies;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <Building2 className="h-4 w-4 inline mr-1" />
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
          ) : !filteredCompanies ||
            filteredCompanies.length === 0 ? (
            <SelectItem value="empty" disabled>
              No companies available
            </SelectItem>
          ) : (
            filteredCompanies.map((company: any) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
