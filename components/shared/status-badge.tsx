"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const statusLower = status.toLowerCase()

  // Auto-detect variant based on status if not provided
  const autoVariant = variant || getVariantForStatus(statusLower)

  return (
    <Badge variant={autoVariant} className={cn("capitalize", className)}>
      {status}
    </Badge>
  )
}

function getVariantForStatus(status: string): "default" | "secondary" | "destructive" | "outline" {
  // Active/Success states
  if ([
    "active",
    "approved",
    "completed",
    "paid",
    "sent",
    "delivered",
    "success",
    "confirmed"
  ].includes(status)) {
    return "default" // Green/Primary
  }

  // Warning/Pending states
  if ([
    "pending",
    "onboarding",
    "review",
    "processing",
    "submitted",
    "partial"
  ].includes(status)) {
    return "secondary" // Yellow/Amber
  }

  // Error/Negative states
  if ([
    "inactive",
    "rejected",
    "failed",
    "cancelled",
    "expired",
    "overdue"
  ].includes(status)) {
    return "destructive" // Red
  }

  // Default
  return "outline"
}

// Status badge with custom colors
interface ColoredStatusBadgeProps {
  status: string
  color?: "green" | "yellow" | "red" | "blue" | "gray"
  className?: string
}

export function ColoredStatusBadge({ status, color, className }: ColoredStatusBadgeProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  }

  const colorClass = color ? colorClasses[color] : colorClasses.gray

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  )
}
