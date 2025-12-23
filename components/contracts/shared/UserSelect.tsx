"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * User selection component with role-based filtering
 *
 * Uses the tRPC API to fetch the list of users
 * Supports role filtering (contractor, payroll, admin, agency)
 */
export function UserSelect({
  value,
  onChange,
  label = "User",
  required = false,
  disabled = false,
  placeholder = "Select a user...",
  roleFilter,
  className,
}: UserSelectProps) {
  // Fetch the list of users
  const { data: allUsers = [], isLoading } = api.user.getAll.useQuery(
    undefined,
    {
      enabled: !disabled,
    }
  );

  // Filter by role if needed
  const users = roleFilter
    ? allUsers.filter((u: any) => {
        // Extract the actual role (string)
        const role =
          typeof u.role === "string"
            ? u.role
            : u.role?.name ?? ""; // if role is an object { name: "Agency" }

        // Case-insensitive comparison
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
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Loading...
            </SelectItem>
          ) : users.length === 0 ? (
            <SelectItem value="empty" disabled>
              No users available
            </SelectItem>
          ) : (
            users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
                {user.email && user.name && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({user.email})
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
