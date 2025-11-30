"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
 * Composant de sélection de pays depuis la table Country
 * 
 * Utilise l'API tRPC pour récupérer la liste des pays
 */
export function CountrySelect({
  value,
  onChange,
  label = "Pays",
  required = false,
  disabled = false,
  placeholder = "Sélectionner un pays...",
  className,
}: CountrySelectProps) {
  // Récupérer la liste des pays
  const { data: countries, isLoading } = api.country.getAll.useQuery(
    undefined,
    {
      enabled: !disabled,
    }
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <Globe className="h-4 w-4 inline mr-1" />
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
          ) : !countries || countries.length === 0 ? (
            <SelectItem value="empty" disabled>
              Aucun pays disponible
            </SelectItem>
          ) : (
            countries.map((country: any) => (
              <SelectItem key={country.id} value={country.id}>
                {country.name}
                {country.code && (
                  <span className="text-xs text-muted-foreground ml-2">({country.code})</span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
