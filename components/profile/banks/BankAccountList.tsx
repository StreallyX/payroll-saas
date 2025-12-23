"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Landmark } from "lucide-react";
import { BankAccountCard } from "./BankAccountCard";
import { BankAccountDialog } from "./BankAccountDialog";
import type { BankAccountFormData } from "./BankAccountForm";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
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

export function BankAccountList() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountFormData | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const { data: accounts, isLoading, refetch } = api.bank.getMyBankAccounts.useQuery();

  const createMutation = api.bank.create.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Bank account created successfully." });
      setDialogOpen(false);
      setEditingAccount(undefined);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bank account.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.bank.update.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Bank account updated successfully." });
      setDialogOpen(false);
      setEditingAccount(undefined);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bank account.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.bank.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Bank account deleted successfully." });
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: BankAccountFormData) => {
    if (data.id) {
      updateMutation.mutate({ id: data.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleDeleteClick = (accountId: string) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      deleteMutation.mutate({ id: accountToDelete });
    }
  };

  const handleAddNew = () => {
    setEditingAccount(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        Loading bank accounts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Bank Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your bank accounts for receiving payments
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {/* Empty State */}
      {!accounts || accounts.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bank accounts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first bank account to receive payments
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </div>
      ) : (
        /* Account List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDeleteClick(account.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingAccount}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bank account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
