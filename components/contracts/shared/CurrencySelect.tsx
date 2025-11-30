"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
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
 * Composant de sélection de devise depuis la table Currency
 * 
 * Utilise l'API tRPC pour récupérer la liste des devises actives
 * Affiche le code et le symbole de la devise (ex: "USD ($)")
 */
export function CurrencySelect({
  value,
  onChange,
  label = "Devise",
  required = false,
  disabled = false,
  placeholder = "Sélectionner une devise...",
  className,
}: CurrencySelectProps) {
  // Récupérer la liste des devises actives
  const { data: currencies, isLoading } = api.currency.getAll.useQuery(
    undefined,
    {
      enabled: !disabled,
    }
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <DollarSign className="h-4 w-4 inline mr-1" />
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
          ) : !currencies || currencies.length === 0 ? (
            <SelectItem value="empty" disabled>
              Aucune devise disponible
            </SelectItem>
          ) : (
            currencies.map((currency: any) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.code}
                {currency.symbol && (
                  <span className="text-muted-foreground ml-1">({currency.symbol})</span>
                )}
                {currency.name && (
                  <span className="text-xs text-muted-foreground ml-2">- {currency.name}</span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
