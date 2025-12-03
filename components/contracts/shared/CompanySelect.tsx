"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
 * Composant de sélection de company avec filtrage par rôle
 * 
 * Utilise l'API tRPC pour récupérer la liste des companies
 * Supporte le filtrage par rôle (agency, client, tenant)
 */
export function CompanySelect({
  value,
  onChange,
  label = "Company",
  required = false,
  disabled = false,
  placeholder = "Sélectionner une company...",
  roleFilter,
  className,
}: CompanySelectProps) {
  // Récupérer la liste des companies
  const { data: companies = [], isLoading } = api.company.getAll.useQuery(
    undefined,
    {
      enabled: !disabled,
    }
  );

  // Filtrer par rôle si nécessaire
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
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Chargement...
            </SelectItem>
          ) : !filteredCompanies || filteredCompanies.length === 0 ? (
            <SelectItem value="empty" disabled>
              Aucune company disponible
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
