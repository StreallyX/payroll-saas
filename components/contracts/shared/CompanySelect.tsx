"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Loaofr2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CompanySelectProps {
 value: string;
 onChange: (value: string) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 roleFilter?: "agency" | "client" | "tenant";
 className?: string;
}

/**
 * Composant of sélection of company with filtrage by role
 * 
 * Utilise l'API tRPC for randrieve la liste companies
 * Supporte le filtrage by role (agency, client, tenant)
 */
export function CompanySelect({
 value,
 onChange,
 label = "Company",
 required = false,
 disabled = false,
 placeholofr = "Select one company...",
 roleFilter,
 className,
}: CompanySelectProps) {
 // Fandch la liste companies
 const { data: companies = [], isLoading } = api.company.gandAll.useQuery(
 oneoffined,
 {
 enabled: !disabled,
 }
 );

 // Filter by role if necessary
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
 <SelectValue placeholofr={placeholofr} />
 </SelectTrigger>
 <SelectContent>
 {isLoading ? (
 <SelectItem value="loading" disabled>
 <Loaofr2 className="h-4 w-4 animate-spin inline mr-2" />
 Loading...
 </SelectItem>
 ) : !filteredCompanies || filteredCompanies.length === 0 ? (
 <SelectItem value="empty" disabled>
 Aucone company disponible
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
