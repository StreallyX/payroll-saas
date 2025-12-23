"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { api } from "@/lib/trpc";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface PendingAction {
  id: string;
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  invoice: any;
  actionLabel: string;
  actionDescription: string;
}

interface ActionGroup {
  type: string;
  label: string;
  count: number;
  actions: PendingAction[];
}

interface PendingActionsProps {
  onActionClick?: (action: PendingAction) => void;
}

const priorityConfig = {
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: AlertTriangle,
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertCircle,
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
  },
  low: {
    label: "Low",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: FileText,
  },
};

const actionTypeConfig = {
  confirm_margin: {
    icon: CheckCircle2,
    color: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-300",
  },
  review_invoice: {
    icon: FileText,
    color: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-300",
  },
  approve_invoice: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-300",
  },
  mark_as_paid: {
    icon: DollarSign,
    color: "bg-indigo-100 text-indigo-800",
    borderColor: "border-indigo-300",
  },
  confirm_payment: {
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-800",
    borderColor: "border-emerald-300",
  },
};

export function PendingActions({ onActionClick }: PendingActionsProps) {
  const { data, isLoading, error } = api.invoice.getPendingActions.useQuery();

  const sortedGroups = useMemo(() => {
    if (!data?.groups) return [];
    
    // Sort groups by priority (most urgent first)
    return [...(data.groups as ActionGroup[])].sort((a: ActionGroup, b: ActionGroup) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = Math.min(...a.actions.map((action) => priorityOrder[action.priority as keyof typeof priorityOrder] || 3));
      const bPriority = Math.min(...b.actions.map((action) => priorityOrder[action.priority as keyof typeof priorityOrder] || 3));
      return aPriority - bPriority;
    });
  }, [data]);

  if (isLoading) {
    return <LoadingState message="Loading pending actions..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load pending actions</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No pending actions"
        description="You're all caught up! There are no tasks requiring your attention at the moment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>Tasks requiring your attention</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {data.totalCount} {data.totalCount === 1 ? "Task" : "Tasks"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Action Groups */}
      {sortedGroups.map((group: ActionGroup) => {
        const typeConfig = actionTypeConfig[group.type as keyof typeof actionTypeConfig] || {
          icon: FileText,
          color: "bg-gray-100 text-gray-800",
          borderColor: "border-gray-300",
        };
        const TypeIcon = typeConfig.icon;

        return (
          <Card key={group.type} className={`border-l-4 ${typeConfig.borderColor}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.label}</CardTitle>
                    <CardDescription>
                      {group.count} {group.count === 1 ? "invoice" : "invoices"} requiring action
                    </CardDescription>
                  </div>
                </div>
                <Badge className={typeConfig.color}>{group.count}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.actions.map((action: PendingAction) => {
                  const invoice = action.invoice;
                  const priorityInfo = priorityConfig[action.priority];
                  const PriorityIcon = priorityInfo.icon;

                  return (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium hover:underline"
                          >
                            Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                          </Link>
                          <Badge
                            variant="outline"
                            className={`${priorityInfo.className} flex items-center gap-1`}
                          >
                            <PriorityIcon className="h-3 w-3" />
                            {priorityInfo.label}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{action.actionDescription}</div>
                          {invoice.contract?.contractReference && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>Contract: {invoice.contract.contractReference}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            {invoice.sender && (
                              <span>From: {invoice.sender.name || invoice.sender.email}</span>
                            )}
                            {invoice.receiver && (
                              <span>To: {invoice.receiver.name || invoice.receiver.email}</span>
                            )}
                            {invoice.totalAmount && (
                              <span className="font-semibold">
                                ${Number(invoice.totalAmount).toFixed(2)}
                              </span>
                            )}
                            {invoice.issueDate && (
                              <span>
                                Issued: {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button size="sm" variant="default">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Invoice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
