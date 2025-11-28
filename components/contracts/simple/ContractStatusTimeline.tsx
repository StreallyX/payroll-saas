"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractStatus } from "./ContractStatusBadge";

interface TimelineStep {
  status: ContractStatus;
  label: string;
  description: string;
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
 * Timeline verticale du workflow de contrat simplifié
 * 
 * Étapes:
 * 1. draft (Brouillon)
 * 2. pending_admin_review (En attente de validation)
 * 3. completed (Complété)
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
      label: "Brouillon",
      description: "Contrat créé et en cours de préparation",
    },
    {
      status: "pending_admin_review",
      label: "En attente de validation",
      description: "Soumis pour validation administrateur",
    },
    {
      status: "completed",
      label: "Complété",
      description: "Validé et prêt pour activation",
    },
    {
      status: "active",
      label: "Actif",
      description: "Contrat activé et en cours d'exécution",
    },
  ];

  /**
   * Détermine l'état d'une étape par rapport au statut actuel
   */
  const getStepState = (step: TimelineStep): "completed" | "current" | "upcoming" => {
    const statusOrder = ["draft", "pending_admin_review", "completed", "active"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step.status);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  /**
   * Trouve la date d'une transition de statut
   */
  const getStepDate = (status: ContractStatus): string | null => {
    const historyItem = statusHistory.find((h) => h.toStatus === status);
    if (!historyItem) return null;

    const date = typeof historyItem.createdAt === "string" 
      ? new Date(historyItem.createdAt) 
      : historyItem.createdAt;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Progression du contrat</CardTitle>
        <CardDescription>
          Suivi des étapes du workflow simplifié
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const state = getStepState(step);
            const stepDate = getStepDate(step.status);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.status} className="relative flex gap-4">
                {/* Ligne verticale */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                      state === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}

                {/* Icône */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
                    state === "completed" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-background text-primary",
                    state === "upcoming" && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : state === "current" ? (
                    <Circle className="h-4 w-4 fill-current" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        "font-medium",
                        state === "upcoming" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    {stepDate && (
                      <span className="text-xs text-muted-foreground">{stepDate}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      state === "upcoming" ? "text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statuts spéciaux */}
        {["cancelled", "paused", "terminated"].includes(currentStatus) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <X className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {currentStatus === "cancelled" && "Contrat annulé"}
                  {currentStatus === "paused" && "Contrat en pause"}
                  {currentStatus === "terminated" && "Contrat terminé"}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Le workflow normal a été interrompu
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
