"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Construction } from "lucide-react";

export function ContractCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void; // ✅ AJOUT ICI
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] py-16 flex flex-col items-center justify-center text-center">

        <Construction className="h-20 w-20 text-yellow-500 mb-6" />

        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">
            🚧 En Construction
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-lg mt-4 px-4">
          Cette fonctionnalité est actuellement en cours de développement.
          Elle sera bientôt disponible.
        </p>

      </DialogContent>
    </Dialog>
  );
}
