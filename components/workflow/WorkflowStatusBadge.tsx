"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkflowStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Maps workflow states to colors
 */
const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  // Timesheet states
  if (statusLower === "draft") return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  if (statusLower === "submitted") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (statusLower === "under_review") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  if (statusLower === "approved") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (statusLower === "rejected") return "bg-red-100 text-red-800 hover:bg-red-100";
  if (statusLower === "changes_requested") return "bg-orange-100 text-orange-800 hover:bg-orange-100";
  
  // Invoice states
  if (statusLower === "pending") return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  if (statusLower === "reviewing") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (statusLower === "pending_margin_confirmation") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  if (statusLower === "sent") return "bg-purple-100 text-purple-800 hover:bg-purple-100";
  if (statusLower === "marked_paid_by_agency") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (statusLower === "payment_received") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (statusLower === "paid") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (statusLower === "overdue") return "bg-red-100 text-red-800 hover:bg-red-100";
  if (statusLower === "cancelled") return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  
  // Payment states
  if (statusLower === "processing") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (statusLower === "completed") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (statusLower === "failed") return "bg-red-100 text-red-800 hover:bg-red-100";
  if (statusLower === "refunded") return "bg-orange-100 text-orange-800 hover:bg-orange-100";
  if (statusLower === "partially_received") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  
  // Payslip/Remittance states
  if (statusLower === "generated") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (statusLower === "validated") return "bg-green-100 text-green-800 hover:bg-green-100";
  
  return "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

/**
 * Formats status text for display
 */
const formatStatus = (status: string): string => {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function WorkflowStatusBadge({ status, className }: WorkflowStatusBadgeProps) {
  return (
    <Badge 
      className={cn(getStatusColor(status), "font-medium", className)}
      variant="outline"
    >
      {formatStatus(status)}
    </Badge>
  );
}
