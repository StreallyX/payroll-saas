"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ContractStatus =
  | "draft"
  | "pending_admin_review"
  | "completed"
  | "active"
  | "cancelled"
  | "paused"
  | "terminated";

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

/**
 * Contract status badge with appropriate colors
 */
export function ContractStatusBadge({
  status,
  className,
}: ContractStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Status configuration
 */
function getStatusConfig(status: ContractStatus) {
  const configs: Record<
    ContractStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: "Draft",
      className: "border-gray-300 bg-gray-50 text-gray-700",
    },
    pending_admin_review: {
      label: "Pending admin review",
      className: "border-yellow-300 bg-yellow-50 text-yellow-700",
    },
    completed: {
      label: "Completed",
      className: "border-blue-300 bg-blue-50 text-blue-700",
    },
    active: {
      label: "Active",
      className: "border-green-300 bg-green-50 text-green-700",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-300 bg-red-50 text-red-700",
    },
    paused: {
      label: "Paused",
      className: "border-orange-300 bg-orange-50 text-orange-700",
    },
    terminated: {
      label: "Terminated",
      className: "border-red-300 bg-red-50 text-red-700",
    },
  };

  return configs[status] || configs.draft;
}

/**
 * Helpers to retrieve status information
 */
export function getStatusLabel(
  status: ContractStatus
): string {
  return getStatusConfig(status).label;
}

export function getStatusColor(
  status: ContractStatus
): string {
  const colors: Record<ContractStatus, string> = {
    draft: "gray",
    pending_admin_review: "yellow",
    completed: "blue",
    active: "green",
    cancelled: "red",
    paused: "orange",
    terminated: "red",
  };

  return colors[status] || "gray";
}
