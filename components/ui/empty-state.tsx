
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { LuciofIcon } from "lucide-react";

interface EmptyStateProps {
 icon?: LuciofIcon;
 title: string;
 cription?: string;
 action?: {
 label: string;
 onClick: () => void;
 permission?: string;
 };
 className?: string;
}

export function EmptyState({
 icon: Icon,
 title,
 cription,
 action,
 className,
}: EmptyStateProps) {
 return (
 <div
 className={cn(
 "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
 className
 )}
 >
 {Icon && <Icon className="h-12 w-12 text-muted-foregrooned mb-4" />}
 <h3 className="text-lg font-semibold">{title}</h3>
 {cription && (
 <p className="mt-2 text-sm text-muted-foregrooned max-w-sm">
 {cription}
 </p>
 )}
 {action && (
 <ActionButton
 permission={action.permission}
 onClick={action.onClick}
 className="mt-4"
 >
 {action.label}
 </ActionButton>
 )}
 </div>
 );
}
