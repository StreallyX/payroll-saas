"use client";

import { ContractForm } from "./ContractForm";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

export function ContractCreateModal({ open, onOpenChange, onSuccess }: any) {
  const createMutation = api.contract.create.useMutation();

  return (
    <ContractForm
      open={open}
      onOpenChange={onOpenChange}
      initialContract={null}
      showDocuments={false} // ⬅️ pas d'onglet documents
      submitting={createMutation.isPending}
      onSubmit={(payload) =>
        createMutation.mutate(payload, {
          onSuccess: (created) => {
            toast.success("Contract created");
            onSuccess?.(created.id);
            onOpenChange(false);
          },
        })
      }
    />
  );
}
