"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface UserSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  filterRole?: string; // Optional: filter users by role
}

/**
 * UserSelector
 * 
 * A reusable dropdown component for selecting users from the system.
 * Fetches users via TRPC and displays them in a searchable dropdown.
 */
export function UserSelector({
  value,
  onValueChange,
  label,
  placeholder = "Select a user",
  disabled = false,
  required = false,
  filterRole,
}: UserSelectorProps) {
  const { data: users, isLoading, error } = api.user.getAll.useQuery(
    undefined,
    {
      // Add any query options if needed
    }
  );

  // Filter users by role if specified
  const filteredUsers = filterRole && users
    ? users.filter((user: any) => user.role === filterRole)
    : users;

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {error && (
            <div className="p-2 text-sm text-red-500">
              Error loading users
            </div>
          )}
          {!error && filteredUsers && filteredUsers.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">
              No users available
            </div>
          )}
          {!error && filteredUsers?.map((user: any) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex flex-col">
                <span className="font-medium">{user.name || user.email}</span>
                {user.name && (
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
                {user.role && (
                  <span className="text-xs text-muted-foreground capitalize">
                    Role: {typeof user.role === 'object' ? user.role.displayName || user.role.name : user.role}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
