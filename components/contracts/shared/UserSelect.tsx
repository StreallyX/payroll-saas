"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { QuickUserCreateDialog } from "./QuickUserCreateDialog";

// Role badge configuration
const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-red-100 text-red-700 border-red-200" },
  agency: { label: "Agency", className: "bg-blue-100 text-blue-700 border-blue-200" },
  contractor: { label: "Contractor", className: "bg-green-100 text-green-700 border-green-200" },
  payroll: { label: "Payroll", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  roleFilter?: "contractor" | "payroll" | "admin" | "agency";
  className?: string;
  allowCreate?: boolean;
}

/**
 * User selection component with role-based filtering
 *
 * Uses the tRPC API to fetch the list of users
 * Supports role filtering (contractor, payroll, admin, agency)
 * Supports inline creation with allowCreate prop
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
  allowCreate = false,
}: UserSelectProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = api.useUtils();

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

  const handleUserCreated = (userId: string) => {
    // Refresh user list and select the new user
    utils.user.getAll.invalidate();
    onChange(userId);
    setShowCreateDialog(false);
  };

  const getRoleLabel = () => {
    if (roleFilter === "contractor") return "Contractor";
    if (roleFilter === "agency") return "Agency User";
    if (roleFilter === "payroll") return "Payroll User";
    return "User";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className={cn(required && "required")}>
            <User className="h-4 w-4 inline mr-1" />
            {label}
            {required && " *"}
          </Label>
          {allowCreate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New {getRoleLabel()}
            </Button>
          )}
        </div>
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
            users.map((user: any) => {
              const userRole = typeof user.role === "string"
                ? user.role.toLowerCase()
                : user.role?.name?.toLowerCase() ?? "";
              const roleBadge = ROLE_BADGES[userRole];

              return (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <span>{user.name || user.email}</span>
                    {roleBadge && (
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", roleBadge.className)}>
                        {roleBadge.label}
                      </Badge>
                    )}
                    {user.email && user.name && (
                      <span className="text-xs text-muted-foreground">
                        ({user.email})
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>

      {/* Quick Create Dialog */}
      {allowCreate && (
        <QuickUserCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          roleFilter={roleFilter}
          onSuccess={handleUserCreated}
        />
      )}
    </div>
  );
}
