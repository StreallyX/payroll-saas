"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { QuickCompanyCreateDialog } from "./QuickCompanyCreateDialog";

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  roleFilter?: "agency" | "client" | "tenant";
  className?: string;
  allowCreate?: boolean;
}

/**
 * Company selection component with role-based filtering
 *
 * Uses the tRPC API to fetch the list of companies
 * Supports filtering by role (agency, client, tenant)
 * Supports inline creation with allowCreate prop
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
  allowCreate = false,
}: CompanySelectProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = api.useUtils();

  // Fetch the list of companies
  const { data: companies = [], isLoading } =
    api.company.getAll.useQuery(undefined, {
      enabled: !disabled,
    });

  // Filter by role if needed
  // Note: "agency" filter shows user-owned companies (agencies are user-owned companies)
  // "tenant" filter shows platform companies
  const filteredCompanies = roleFilter
    ? companies.filter((c: any) => {
        if (roleFilter === "agency") {
          // Agencies are user-owned companies
          return c.ownerType === "user";
        }
        return c.ownerType === roleFilter;
      })
    : companies;

  const handleCompanyCreated = (companyId: string) => {
    // Refresh company list and select the new company
    utils.company.getAll.invalidate();
    onChange(companyId);
    setShowCreateDialog(false);
  };

  const getTypeLabel = () => {
    if (roleFilter === "agency") return "Agency";
    if (roleFilter === "client") return "Client";
    if (roleFilter === "tenant") return "Company";
    return "Company";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className={cn(required && "required")}>
            <Building2 className="h-4 w-4 inline mr-1" />
            {label}
            {required && " *"}
          </Label>
          {allowCreate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New {getTypeLabel()}
            </Button>
          )}
        </div>
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

      {/* Quick Create Dialog */}
      {allowCreate && (
        <QuickCompanyCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          ownerType={roleFilter === "tenant" ? "tenant" : "user"}
          onSuccess={handleCompanyCreated}
        />
      )}
    </div>
  );
}
