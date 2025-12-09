"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UserSelect } from "./UserSelect";
import { CompanySelect } from "./CompanySelect";
import { Plus, X, User, Building2 } from "lucide-react";
import { useUserCompany } from "@/hooks/contracts/useUserCompany";
import { toast } from "sonner";

export interface ParticipantPreSelection {
  userId?: string;
  companyId?: string;
  role: string;
  // Données pour l'affichage (non envoyées au serveur)
  _tempId?: string;
  _userName?: string;
  _userEmail?: string;
  _companyName?: string;
}

interface ParticipantPreSelectorProps {
  participants: ParticipantPreSelection[];
  onChange: (participants: ParticipantPreSelection[]) => void;
  showAddButton?: boolean;
}

/**
 * Composant pour sélectionner des participants avant la création d'un contrat
 * Utilisé dans les modals de création (CreateMSAModal, CreateSOWModal, CreateNormContractModal)
 */
export function ParticipantPreSelector({ participants, onChange, showAddButton = true }: ParticipantPreSelectorProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [linkUserCompany, setLinkUserCompany] = useState(false);
  const [role, setRole] = useState("additional");
  
  const { company: userCompany } = useUserCompany(selectedUserId);
  
  // Si linkUserCompany est activé et qu'une company est trouvée pour l'utilisateur
  const effectiveCompanyId = linkUserCompany && userCompany?.company ? userCompany.company.id : selectedCompanyId;
  
  const handleAddParticipant = () => {
    if (!selectedUserId && !selectedCompanyId) {
      toast.error("Veuillez sélectionner au moins un utilisateur ou une company");
      return;
    }
    
    if (!role.trim()) {
      toast.error("Veuillez spécifier un rôle");
      return;
    }
    
    const newParticipant: ParticipantPreSelection = {
      userId: selectedUserId || undefined,
      companyId: effectiveCompanyId || undefined,
      role: role.trim(),
      _tempId: Date.now().toString(),
    };
    
    onChange([...participants, newParticipant]);
    
    // Réinitialiser le formulaire
    setSelectedUserId("");
    setSelectedCompanyId("");
    setLinkUserCompany(false);
    setRole("additional");
    
    toast.success("Participant ajouté");
  };
  
  const handleRemoveParticipant = (tempId: string) => {
    onChange(participants.filter(p => p._tempId !== tempId));
    toast.success("Participant supprimé");
  };
  
  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      {showAddButton && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter des participants supplémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Utilisateur</Label>
              <UserSelect
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Sélectionnez un utilisateur"
              />
            </div>
            
            {selectedUserId && userCompany?.company && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="link-company"
                  checked={linkUserCompany}
                  onCheckedChange={(checked) => setLinkUserCompany(checked === true)}
                />
                <Label
                  htmlFor="link-company"
                  className="text-sm font-normal cursor-pointer"
                >
                  Lier aussi la company {userCompany.company.name}
                </Label>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="company-select">Company (optionnel)</Label>
              <CompanySelect
                value={effectiveCompanyId}
                onChange={setSelectedCompanyId}
                placeholder="Sélectionnez une company"
                disabled={linkUserCompany && !!userCompany?.company}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-input">Rôle</Label>
              <Input
                id="role-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: additional, observer, etc."
              />
            </div>
            
            <Button
              onClick={handleAddParticipant}
              disabled={(!selectedUserId && !selectedCompanyId)}
              className="w-full"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter le participant
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Liste des participants ajoutés */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Participants supplémentaires ({participants.length})
          </Label>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant._tempId}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                {participant.userId ? (
                  <>
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Utilisateur ID: {participant.userId}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Rôle: {participant.role}
                      </p>
                    </div>
                  </>
                ) : participant.companyId ? (
                  <>
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Company ID: {participant.companyId}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Rôle: {participant.role}
                      </p>
                    </div>
                  </>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant._tempId!)}
                  className="flex-shrink-0"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
