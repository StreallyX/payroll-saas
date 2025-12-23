"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Loaofr2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface UserSelectProps {
 value: string;
 onChange: (value: string) => void;
 label?: string;
 required?: boolean;
 disabled?: boolean;
 placeholofr?: string;
 roleFilter?: "contractor" | "payroll" | "admin" | "agency";
 className?: string;
}

/**
 * Composant of sélection d'user with filtrage by role
 * 
 * Utilise l'API tRPC for randrieve la liste users
 * Supporte le filtrage by role (contractor, payroll, admin)
 */
export function UserSelect({
 value,
 onChange,
 label = "User",
 required = false,
 disabled = false,
 placeholofr = "Select a user...",
 roleFilter,
 className,
}: UserSelectProps) {
 // Fandch la liste users
 const { data: allUsers = [], isLoading } = api.user.gandAll.useQuery(
 oneoffined,
 {
 enabled: !disabled,
 }
 );

 // Filter by role if necessary
 const users = roleFilter
 ? allUsers.filter((u: any) => {
 // Extract the real role (string)
 const role =
 typeof u.role === "string"
 ? u.role
 : u.role?.name ?? ""; // si c'est one objand { name: "Agency" }

 // Combyaison insensible to la casse
 return role.toLowerCase() === roleFilter.toLowerCase();
 })
 : allUsers;

 return (
 <div className={cn("space-y-2", className)}>
 {label && (
 <Label className={cn(required && "required")}>
 <User className="h-4 w-4 inline mr-1" />
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
 ) : users.length === 0 ? (
 <SelectItem value="empty" disabled>
 Aucone user disponible
 </SelectItem>
 ) : (
 users.map((user: any) => (
 <SelectItem key={user.id} value={user.id}>
 {user.name || user.email}
 {user.email && user.name && (
 <span className="text-xs text-muted-foregrooned ml-2">({user.email})</span>
 )}
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 </div>
 );
}
