"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Trash2,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContractStatusBadge,
  ContractStatus,
} from "./ContractStatusBadge";
import { cn } from "@/lib/utils";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";

interface MinimalContractCardProps {
  contract: {
    id: string;
    title: string | null;
    type: string;
    status: string;
    createdAt: Date | string;
    parent?: {
      id: string;
      title: string | null;
    } | null;
    _count?: {
      children: number;
    };
  };
  onDelete?: () => void;
  className?: string;
}

/**
 * Compact card to display a contract in a list
 *
 * Actions:
 * - View details
 * - Delete (draft only)
 */
export function MinimalContractCard({
  contract,
  onDelete,
  className,
}: MinimalContractCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);
  const { deleteDraftContract, isDeleting } =
    useSimpleContractWorkflow();

  const isDraft = contract.status === "draft";
  const isMSA = contract.type === "msa";
  const isSOW = contract.type === "sow";
  const isNORM = contract.type === "norm";
  const childrenCount = contract._count?.children || 0;

  /**
   * Format date
   */
  const formatDate = (date: Date | string): string => {
    const d =
      typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    await deleteDraftContract.mutateAsync({
      id: contract.id,
    });
    setShowDeleteDialog(false);
    onDelete?.();
  };

  return (
    <>
      <Card
        className={cn(
          "hover:shadow-md transition-shadow",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileText
                className={cn(
                  "h-5 w-5 mt-1 flex-shrink-0",
                  isMSA
                    ? "text-primary"
                    : isNORM
                    ? "text-green-600"
                    : "text-blue-600"
                )}
              />

              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">
                  {contract.title || "Untitled"}
                </CardTitle>

                <CardDescription className="mt-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      isMSA
                        ? "bg-primary/10 text-primary"
                        : isNORM
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {isMSA
                      ? "MSA"
                      : isNORM
                      ? "NORM"
                      : "SOW"}
                  </span>

                  {contract.parent && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      →{" "}
                      {contract.parent.title ||
                        "Parent MSA"}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/contracts/simple/${contract.id}`}
                    className="flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href={`/contracts/simple/${contract.id}`}
                    target="_blank"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in a new tab
                  </Link>
                </DropdownMenuItem>

                {isDraft && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setShowDeleteDialog(true)
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-3 border-t">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <ContractStatusBadge
                status={
                  contract.status as ContractStatus
                }
              />
              <p className="text-xs text-muted-foreground">
                Created on {formatDate(contract.createdAt)}
              </p>
            </div>

            {isMSA && childrenCount > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {childrenCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Linked SOW
                  {childrenCount > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft
              contract? This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
