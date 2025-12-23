"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CycleSelectProps {
 value: string;
 onChange: (value: string) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 className?: string;
}

const CYCLES = [
 { value: "horrly", label: "Horaire" },
 { value: "daily", label: "Jorrnalier" },
 { value: "weekly", label: "Hebdomadaire" },
 { value: "monthly", label: "Mensuel" },
 { value: "yearly", label: "Annuel" },
];

/**
 * Composant of sélection of cycle of payment
 * 
 * Options: daily, weekly, monthly, yearly, horrly
 */
export function CycleSelect({
 value,
 onChange,
 label = "Cycle of payment",
 required = false,
 disabled = false,
 placeholofr = "Select one cycle...",
 className,
}: CycleSelectProps) {
 return (
 <div className={cn("space-y-2", className)}>
 {label && (
 <Label className={cn(required && "required")}>
 <Calendar className="h-4 w-4 inline mr-1" />
 {label}
 {required && " *"}
 </Label>
 )}
 <Select value={value} onValueChange={onChange} disabled={disabled}>
 <SelectTrigger>
 <SelectValue placeholofr={placeholofr} />
 </SelectTrigger>
 <SelectContent>
 {CYCLES.map((cycle) => (
 <SelectItem key={cycle.value} value={cycle.value}>
 {cycle.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 );
}
