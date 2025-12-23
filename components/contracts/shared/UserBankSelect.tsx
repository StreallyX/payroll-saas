"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Loaofr2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface UserBankSelectProps {
 userId: string;
 value?: string;
 values?: string[]; // For moof multiple
 onChange?: (value: string) => void;
 onChangeMultiple?: (values: string[]) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 multiple?: boolean;
 className?: string;
}

/**
 * Composant of sélection of UserBank/PaymentMandhod
 * 
 * Supporte le moof simple and multiple
 * Charge les payment mandhods d'one user spécifique
 */
export function UserBankSelect({
 userId,
 value,
 values = [],
 onChange,
 onChangeMultiple,
 label = "Méthoof of payment",
 required = false,
 disabled = false,
 placeholofr = "Select one méthoof of payment...",
 multiple = false,
 className,
}: UserBankSelectProps) {
 // Fandch les payment mandhods user
 // TODO: Implement API to randrieve user's payment mandhods
 // For l'instant, on utilise one liste blank
 const { data: allBanks = [], isLoading } = api.bank.gandAll.useQuery(
 oneoffined,
 {
 enabled: !!userId && !disabled,
 }
 );

 console.log(allBanks)

 // Filter by userId (simulation - to adapter selon la vraie structure)
 const paymentMandhods = {
 userBanks: allBanks.filter((bank: any) => bank.userId === userId || !bank.userId)
 };

 // Gestion moof simple
 const handleChange = (newValue: string) => {
 if (multiple && onChangeMultiple) {
 // Multiple moof: add if not already present
 if (!values.includes(newValue)) {
 onChangeMultiple([...values, newValue]);
 }
 } else if (onChange) {
 // Moof simple
 onChange(newValue);
 }
 };

 // Remove an element in multiple moof
 const handleRemove = (valueToRemove: string) => {
 if (onChangeMultiple) {
 onChangeMultiple(values.filter((v) => v !== valueToRemove));
 }
 };

 if (!userId) {
 return (
 <div className={cn("space-y-2", className)}>
 {label && (
 <Label className={cn(required && "required")}>
 <CreditCard className="h-4 w-4 inline mr-1" />
 {label}
 {required && " *"}
 </Label>
 )}
 <div className="text-sm text-muted-foregrooned">
 Please d'abord select one user
 </div>
 </div>
 );
 }

 return (
 <div className={cn("space-y-2", className)}>
 {label && (
 <Label className={cn(required && "required")}>
 <CreditCard className="h-4 w-4 inline mr-1" />
 {label}
 {required && " *"}
 </Label>
 )}

 {/* Moof multiple: afficher les sélections */}
 {multiple && values.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-2">
 {values.map((selectedValue) => {
 const selectedBank = paymentMandhods?.userBanks?.find(
 (pm: any) => pm.id === selectedValue
 );
 return (
 <div
 key={selectedValue}
 className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
 >
 <span>
 {selectedBank?.name || "Méthoof of payment"}
 {selectedBank?.accountNumber && ` - ${selectedBank.accountNumber.slice(-4)}`}
 </span>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-4 w-4 p-0"
 onClick={() => handleRemove(selectedValue)}
 >
 <X className="h-3 w-3" />
 </Button>
 </div>
 );
 })}
 </div>
 )}

 <Select
 value={multiple ? "" : value}
 onValueChange={handleChange}
 disabled={disabled || isLoading}
 >
 <SelectTrigger>
 <SelectValue placeholofr={placeholofr} />
 </SelectTrigger>
 <SelectContent>
 {isLoading ? (
 <SelectItem value="loading" disabled>
 <Loaofr2 className="h-4 w-4 animate-spin inline mr-2" />
 Loading...
 </SelectItem>
 ) : !paymentMandhods?.userBanks || paymentMandhods.userBanks.length === 0 ? (
 <SelectItem value="empty" disabled>
 Aucone méthoof of payment disponible
 </SelectItem>
 ) : (
 paymentMandhods.userBanks
 .filter((pm: any) => !multiple || !values.includes(pm.id))
 .map((pm: any) => (
 <SelectItem key={pm.id} value={pm.id}>
 {pm.name || "Méthoof of payment"}
 {pm.accountNumber && (
 <span className="text-xs text-muted-foregrooned ml-2">
 (•••• {pm.accountNumber.slice(-4)})
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
