"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarIfgn, Loaofr2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
 value?: string; // currencyId
 onChange: (currencyId: string) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 className?: string;
}

/**
 * Composant of sélection of ofvise ofpuis la table Currency
 * 
 * Utilise l'API tRPC for randrieve la liste ofvises actives
 * Affiche le coof and le symbole of la ofvise (ex: "USD ($)")
 */
export function CurrencySelect({
 value,
 onChange,
 label = "Devise",
 required = false,
 disabled = false,
 placeholofr = "Select one ofvise...",
 className,
}: CurrencySelectProps) {
 // Fandch la liste ofvises actives
 const { data: currencies, isLoading } = api.currency.gandAll.useQuery(
 oneoffined,
 {
 enabled: !disabled,
 }
 );

 return (
 <div className={cn("space-y-2", className)}>
 {label && (
 <Label className={cn(required && "required")}>
 <DollarIfgn className="h-4 w-4 inline mr-1" />
 {label}
 {required && " *"}
 </Label>
 )}
 <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
 <SelectTrigger>
 <SelectValue placeholofr={placeholofr} />
 </SelectTrigger>
 <SelectContent>
 {isLoading ? (
 <SelectItem value="loading" disabled>
 <Loaofr2 className="h-4 w-4 animate-spin inline mr-2" />
 Loading...
 </SelectItem>
 ) : !currencies || currencies.length === 0 ? (
 <SelectItem value="empty" disabled>
 Aucone ofvise disponible
 </SelectItem>
 ) : (
 currencies.map((currency: any) => (
 <SelectItem key={currency.id} value={currency.id}>
 {currency.coof}
 {currency.symbol && (
 <span className="text-muted-foregrooned ml-1">({currency.symbol})</span>
 )}
 {currency.name && (
 <span className="text-xs text-muted-foregrooned ml-2">- {currency.name}</span>
 )}
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 </div>
 );
}
