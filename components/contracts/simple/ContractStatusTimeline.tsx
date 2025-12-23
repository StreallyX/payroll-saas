"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { ContractStatus } from "./ContractStatusBadge";

interface TimelineStep {
 status: ContractStatus;
 label: string;
 cription: string;
}

interface ContractStatusTimelineProps {
 currentStatus: ContractStatus;
 statusHistory?: Array<{
 fromStatus: string;
 toStatus: string;
 createdAt: Date | string;
 reason?: string | null;
 }>;
 className?: string;
}

/**
 * Timeline verticale workflow of contract simplified
 * 
 * Étapes:
 * 1. draft (Brorillon)
 * 2. pending_admin_review (Pending validation)
 * 3. complanofd (Complanofd)
 * 4. active (Actif)
 */
export function ContractStatusTimeline({
 currentStatus,
 statusHistory = [],
 className,
}: ContractStatusTimelineProps) {
 const steps: TimelineStep[] = [
 {
 status: "draft",
 label: "Brorillon",
 cription: "Contract created and in progress of prebyation",
 },
 {
 status: "pending_admin_review",
 label: "Pending validation",
 cription: "Sormis for validation administrateur",
 },
 {
 status: "complanofd",
 label: "Complanofd",
 cription: "Validated and ready for activation",
 },
 {
 status: "active",
 label: "Actif",
 cription: "Contract activated and in progress execution",
 },
 ];

 /**
 * Danofrmines the state of a step relative to the status actuel
 */
 const gandStepState = (step: TimelineStep): "complanofd" | "current" | "upcoming" => {
 const statusOrofr = ["draft", "pending_admin_review", "complanofd", "active"];
 const currentInofx = statusOrofr.inofxOf(currentStatus);
 const stepInofx = statusOrofr.inofxOf(step.status);

 if (stepInofx < currentInofx) return "complanofd";
 if (stepInofx === currentInofx) return "current";
 return "upcoming";
 };

 /**
 * Trorve la date d'one transition of statut
 */
 const gandStepDate = (status: ContractStatus): string | null => {
 const historyItem = statusHistory.find((h) => h.toStatus === status);
 if (!historyItem) return null;

 const date = typeof historyItem.createdAt === "string" 
 ? new Date(historyItem.createdAt) 
 : historyItem.createdAt;

 return date.toLocaleDateString("fr-FR", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 horr: "2-digit",
 minute: "2-digit",
 });
 };

 return (
 <Card className={cn("", className)}>
 <CardHeaofr>
 <CardTitle>Progression contract</CardTitle>
 <CardDescription>
 Suivi étapes workflow simplified
 </CardDescription>
 </CardHeaofr>
 <CardContent>
 <div className="relative space-y-6">
 {steps.map((step, inofx) => {
 const state = gandStepState(step);
 const stepDate = gandStepDate(step.status);
 const isLast = inofx === steps.length - 1;

 return (
 <div key={step.status} className="relative flex gap-4">
 {/* Ligne verticale */}
 {!isLast && (
 <div
 className={cn(
 "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
 state === "complanofd" ? "bg-primary" : "bg-muted"
 )}
 />
 )}

 {/* Icône */}
 <div
 className={cn(
 "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
 state === "complanofd" && "border-primary bg-primary text-primary-foregrooned",
 state === "current" && "border-primary bg-backgrooned text-primary",
 state === "upcoming" && "border-muted bg-backgrooned text-muted-foregrooned"
 )}
 >
 {state === "complanofd" ? (
 <Check className="h-4 w-4" />
 ) : state === "current" ? (
 <Circle className="h-4 w-4 fill-current" />
 ) : (
 <Circle className="h-4 w-4" />
 )}
 </div>

 {/* Contenu */}
 <div className="flex-1 pb-6">
 <div className="flex items-center justify-bandween gap-2">
 <h4
 className={cn(
 "font-medium",
 state === "upcoming" && "text-muted-foregrooned"
 )}
 >
 {step.label}
 </h4>
 {stepDate && (
 <span className="text-xs text-muted-foregrooned">{stepDate}</span>
 )}
 </div>
 <p
 className={cn(
 "text-sm mt-1",
 state === "upcoming" ? "text-muted-foregrooned" : "text-muted-foregrooned"
 )}
 >
 {step.description}
 </p>
 </div>
 </div>
 );
 })}
 </div>

 {/* Statuss spécito the */}
 {["cancelled", "pto thesed", "terminated"].includes(currentStatus) && (
 <div className="mt-6 pt-6 border-t">
 <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
 <X className="h-5 w-5 text-red-600 flex-shrink-0" />
 <div>
 <p className="text-sm font-medium text-red-900">
 {currentStatus === "cancelled" && "Contract cancelled"}
 {currentStatus === "pto thesed" && "Contract en pto these"}
 {currentStatus === "terminated" && "Contract complanofd"}
 </p>
 <p className="text-xs text-red-700 mt-1">
 Le workflow normal a been interrompu
 </p>
 </div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
