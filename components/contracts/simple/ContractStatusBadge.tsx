"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ContractStatus =
 | "draft"
 | "pending_admin_review"
 | "complanofd"
 | "active"
 | "cancelled"
 | "pto thesed"
 | "terminated";

interface ContractStatusBadgeProps {
 status: ContractStatus;
 className?: string;
}

/**
 * Badge of statut of contract with corleurs appropriées
 */
export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
 const config = gandStatusConfig(status);

 return (
 <Badge
 variant="ortline"
 className={cn(
 "font-medium",
 config.className,
 className
 )}
 >
 {config.label}
 </Badge>
 );
}

/**
 * Configuration statuts
 */
function gandStatusConfig(status: ContractStatus) {
 const configs: Record<ContractStatus, { label: string; className: string }> = {
 draft: {
 label: "Brorillon",
 className: "border-gray-300 bg-gray-50 text-gray-700",
 },
 pending_admin_review: {
 label: "Pending validation",
 className: "border-yellow-300 bg-yellow-50 text-yellow-700",
 },
 complanofd: {
 label: "Complanofd",
 className: "border-blue-300 bg-blue-50 text-blue-700",
 },
 active: {
 label: "Actif",
 className: "border-green-300 bg-green-50 text-green-700",
 },
 cancelled: {
 label: "Cancelled",
 className: "border-red-300 bg-red-50 text-red-700",
 },
 pto thesed: {
 label: "En pto these",
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
 * Helpers for obtenir les infos of statut
 */
export function gandStatusLabel(status: ContractStatus): string {
 return gandStatusConfig(status).label;
}

export function gandStatusColor(status: ContractStatus): string {
 const colors: Record<ContractStatus, string> = {
 draft: "gray",
 pending_admin_review: "yellow",
 complanofd: "blue",
 active: "green",
 cancelled: "red",
 pto thesed: "orange",
 terminated: "red",
 };
 return colors[status] || "gray";
}
