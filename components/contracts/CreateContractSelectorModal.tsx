"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, FileText, FileSignature } from "lucide-react";

type SelectorType = "msa" | "sow" | "contract";

export function CreateContractSelectorModal({
  open,
  onOpenChange,
  onSelect,
  canCreateMSA,
  canCreateSOW,
  canCreateContract,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (type: SelectorType) => void;

  canCreateMSA: boolean;
  canCreateSOW: boolean;
  canCreateContract: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Créer un contrat
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-4">

          {/* MSA */}
          {canCreateMSA && (
            <Card
              onClick={() => {
                onSelect("msa");
                onOpenChange(false);
              }}
              className="p-4 cursor-pointer border hover:border-blue-500 hover:bg-blue-50 transition rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-lg">
                    Master Service Agreement
                  </div>
                  <div className="text-sm text-gray-500">
                    Contrat cadre signé une seule fois avec le client.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SOW */}
          {canCreateSOW && (
            <Card
              onClick={() => {
                onSelect("sow");
                onOpenChange(false);
              }}
              className="p-4 cursor-pointer border hover:border-green-500 hover:bg-green-50 transition rounded-xl"
            >
              <div className="flex items-center gap-3">
                <FileSignature className="w-8 h-8 text-green-600" />
                <div>
                  <div className="font-semibold text-lg">
                    Statement of Work
                  </div>
                  <div className="text-sm text-gray-500">
                    SOW lié à un MSA — contrat opérationnel pour un contractor.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Contract classique */}
          {canCreateContract && (
            <Card
              onClick={() => {
                onSelect("contract");
                onOpenChange(false);
              }}
              className="p-4 cursor-pointer border hover:border-purple-500 hover:bg-purple-50 transition rounded-xl"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="font-semibold text-lg">
                    Contrat classique
                  </div>
                  <div className="text-sm text-gray-500">
                    Contrat générique multi-participants (agency, contractor, client…)
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
