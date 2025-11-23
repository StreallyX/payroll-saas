"use client";

import { ContractForm } from "./ContractForm";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

export function ContractEditModal({ open, onOpenChange, contract, onSuccess }: any) {
  const updateMutation = api.contract.update.useMutation();

  return (
    <ContractForm
      open={open}
      onOpenChange={onOpenChange}
      initialContract={contract}
      showDocuments={true} // ⬅️ on active les documents
      submitting={updateMutation.isPending}
      onSubmit={(payload) =>
        updateMutation.mutate(
          { id: contract.id, ...payload },
          {
            onSuccess: () => {
              toast.success("Contract updated");
              onSuccess?.();
              onOpenChange(false);
            },
          }
        )
      }
    />
  );
}
