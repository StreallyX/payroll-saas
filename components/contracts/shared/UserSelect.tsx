"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  roleFilter?: "contractor" | "payroll" | "admin" | "agency";
  className?: string;
}

/**
 * Composant de sélection d'utilisateur avec filtrage par rôle
 * 
 * Utilise l'API tRPC pour récupérer la liste des utilisateurs
 * Supporte le filtrage par rôle (contractor, payroll, admin)
 */
export function UserSelect({
  value,
  onChange,
  label = "Utilisateur",
  required = false,
  disabled = false,
  placeholder = "Sélectionner un utilisateur...",
  roleFilter,
  className,
}: UserSelectProps) {
  // Récupérer la liste des utilisateurs
  const { data: allUsers = [], isLoading } = api.user.getAll.useQuery(
    undefined,
    {
      enabled: !disabled,
    }
  );

  // Filtrer par rôle si nécessaire
  const users = roleFilter
    ? allUsers.filter((u: any) => {
        // Extraire le rôle réel (string)
        const role =
          typeof u.role === "string"
            ? u.role
            : u.role?.name ?? "";  // si c'est un objet { name: "Agency" }

        // Comparaison insensible à la casse
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
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Chargement...
            </SelectItem>
          ) : users.length === 0 ? (
            <SelectItem value="empty" disabled>
              Aucun utilisateur disponible
            </SelectItem>
          ) : (
            users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
                {user.email && user.name && (
                  <span className="text-xs text-muted-foreground ml-2">({user.email})</span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
