// components/profile/sections/SecuritySection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { format } from "date-fns";

type Props = {
  email: string;
  roleName?: string | null;
  twoFactorEnabled?: boolean | null;
  isActive?: boolean | null;
  lastLoginAt?: Date | string | null;
};

export function SecuritySection({
  email,
  roleName,
  twoFactorEnabled,
  isActive,
  lastLoginAt,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Login & Security
        </CardTitle>
        <CardDescription>Authentication and security information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{email}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Role</span>
          <span className="text-sm font-medium">{roleName || "N/A"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Two-Factor Authentication</span>
          <Badge variant={twoFactorEnabled ? "default" : "outline"}>
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Account Status</span>
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Active" : "Disabled"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Login</span>
          <span className="text-sm">
            {lastLoginAt ? format(new Date(lastLoginAt), "yyyy-MM-dd HH:mm") : "Never"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
