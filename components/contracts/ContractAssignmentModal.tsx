"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, Building2, Shield } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contract: any; // Contract object with participants
  onSuccess?: () => void;
};

/**
 * 🔥 NEW COMPONENT — Contract Assignment Modal
 * 
 * Permet aux admins de:
 * - Voir les contrats liés au tenant
 * - Assigner une tenant company au contrat
 * - Assigner un user spécifique comme Admin principal
 * - Assigner un user spécifique comme Approver
 */
export function ContractAssignmentModal({
  open,
  onOpenChange,
  contract,
  onSuccess,
}: Props) {
  // ============================================================
  // STATE
  // ============================================================
  const [tenantCompanyId, setTenantCompanyId] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [approverUserId, setApproverUserId] = useState("");

  // ============================================================
  // DATA LOADING
  // ============================================================
  
  // Load tenant companies only (tenantCompany = true)
  const { data: companies = [] } = api.company.getAll.useQuery();
  const tenantCompanies = companies.filter((c: any) => c.tenantCompany === true);

  // Load all users for admin/approver selection
  const { data: users = [] } = api.user.getAll.useQuery();

  // ============================================================
  // MUTATIONS
  // ============================================================
  
  // Mutation to add participants to contract
  const addParticipant = api.contract.addParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participant ajouté avec succès");
    },
    onError: (err) => {
      toast.error(`Erreur: ${err.message}`);
    },
  });

  // Mutation to update contract company
  const updateContract = api.contract.update.useMutation({
    onSuccess: () => {
      toast.success("Contrat mis à jour avec succès");
    },
    onError: (err) => {
      toast.error(`Erreur: ${err.message}`);
    },
  });

  // ============================================================
  // VALIDATION
  // ============================================================
  const isValid = tenantCompanyId && adminUserId && approverUserId;

  // ============================================================
  // HANDLERS
  // ============================================================
  
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      // 1. Update contract with tenant company
      await updateContract.mutateAsync({
        id: contract.id,
        companyId: tenantCompanyId,
      });

      // 2. Add admin participant
      await addParticipant.mutateAsync({
        contractId: contract.id,
        userId: adminUserId,
        role: "client_admin",
        requiresSignature: true,
        isPrimary: false,
      });

      // 3. Add approver participant
      await addParticipant.mutateAsync({
        contractId: contract.id,
        userId: approverUserId,
        role: "approver",
        requiresSignature: false,
        isPrimary: false,
      });

      toast.success("Assignations effectuées avec succès !");
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setTenantCompanyId("");
      setAdminUserId("");
      setApproverUserId("");
    } catch (error: any) {
      toast.error(`Erreur lors de l'assignation: ${error.message}`);
    }
  };

  // ============================================================
  // DERIVED DATA
  // ============================================================
  const existingAdmin = contract?.participants?.find(
    (p: any) => p.role === "client_admin"
  );
  const existingApprover = contract?.participants?.find(
    (p: any) => p.role === "approver"
  );

  // ============================================================
  // UI
  // ============================================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserCheck className="h-6 w-6 text-blue-600" />
            Assigner Admin & Approver
          </DialogTitle>
          <DialogDescription>
            Assignez une tenant company et des utilisateurs spécifiques pour ce contrat
          </DialogDescription>
        </DialogHeader>

        {/* CONTRACT INFO */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-sm">
              {contract?.type?.toUpperCase()}
            </Badge>
            <span className="font-semibold">{contract?.title}</span>
          </div>
          <p className="text-sm text-gray-600">{contract?.description || "Aucune description"}</p>
        </div>

        {/* CURRENT ASSIGNMENTS */}
        {(existingAdmin || existingApprover) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Assignations existantes
            </h4>
            {existingAdmin && (
              <p className="text-sm text-yellow-800">
                • Admin: {existingAdmin.user?.name}
              </p>
            )}
            {existingApprover && (
              <p className="text-sm text-yellow-800">
                • Approver: {existingApprover.user?.name}
              </p>
            )}
          </div>
        )}

        {/* FORM */}
        <div className="space-y-4 mt-4">
          
          {/* TENANT COMPANY SELECTION */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Tenant Company *
            </Label>
            <Select value={tenantCompanyId} onValueChange={setTenantCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une tenant company" />
              </SelectTrigger>
              <SelectContent>
                {tenantCompanies.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    Aucune tenant company trouvée. Créez-en une d'abord.
                  </div>
                ) : (
                  tenantCompanies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Sélectionnez une company marquée comme "Tenant Company"
            </p>
          </div>

          {/* ADMIN USER SELECTION */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-blue-600" />
              Admin Principal *
            </Label>
            <Select value={adminUserId} onValueChange={setAdminUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un admin" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex flex-col">
                      <span>{u.name}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              L'admin principal sera responsable de la signature du contrat
            </p>
          </div>

          {/* APPROVER USER SELECTION */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-green-600" />
              Approver *
            </Label>
            <Select value={approverUserId} onValueChange={setApproverUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un approver" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex flex-col">
                      <span>{u.name}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              L'approver validera le contrat avant activation
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addParticipant.isPending || updateContract.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || addParticipant.isPending || updateContract.isPending}
          >
            {(addParticipant.isPending || updateContract.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
