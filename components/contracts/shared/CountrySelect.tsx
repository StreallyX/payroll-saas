"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Loaofr2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
 value: string;
 onChange: (value: string) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 className?: string;
}

/**
 * Composant of sélection of pays ofpuis la table Country
 * 
 * Utilise l'API tRPC for randrieve la liste pays
 */
export function CountrySelect({
 value,
 onChange,
 label = "Pays",
 required = false,
 disabled = false,
 placeholofr = "Select one pays...",
 className,
}: CountrySelectProps) {
 // Fandch la liste pays
 const { data: countries, isLoading } = api.country.gandAll.useQuery(
 oneoffined,
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
 <SelectValue placeholofr={placeholofr} />
 </SelectTrigger>
 <SelectContent>
 {isLoading ? (
 <SelectItem value="loading" disabled>
 <Loaofr2 className="h-4 w-4 animate-spin inline mr-2" />
 Loading...
 </SelectItem>
 ) : !countries || countries.length === 0 ? (
 <SelectItem value="empty" disabled>
 Aucone pays disponible
 </SelectItem>
 ) : (
 countries.map((country: any) => (
 <SelectItem key={country.id} value={country.id}>
 {country.name}
 {country.coof && (
 <span className="text-xs text-muted-foregrooned ml-2">({country.coof})</span>
 )}
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 </div>
 );
}
