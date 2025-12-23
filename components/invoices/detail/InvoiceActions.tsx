"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WorkflowActionButtons } from "@/components/workflow";

interface Action {
  action: string;
  label: string;
  variant: "default" | "outline" | "destructive";
  requiresReason?: boolean;
}

interface InvoiceActionsProps {
  actions: Action[];
  onAction: (action: string, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function InvoiceActions({ actions, onAction, isLoading }: InvoiceActionsProps) {
  if (actions.length > 0) {
    return (
      <Card>
        <CardContent className="flex justify-between items-center py-4">
          <Button variant="outline" asChild>
            <Link href="/invoices">Close</Link>
          </Button>
          <WorkflowActionButtons
            actions={actions}
            onAction={onAction}
            isLoading={isLoading}
            className="flex gap-2"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex justify-end py-4">
        <Button variant="outline" asChild>
          <Link href="/invoices">Close</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
