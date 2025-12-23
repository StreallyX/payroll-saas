"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UserSelect } from "./UserSelect";
import { CompanySelect } from "./CompanySelect";
import { ParticipantCard } from "./ParticipantCard";
import { Plus, Loader2 } from "lucide-react";
import { useParticipants } from "@/hooks/contracts/useParticipants";
import { useUserCompany } from "@/hooks/contracts/useUserCompany";
import { toast } from "sonner";

interface ParticipantSelectorProps {
  contractId: string;
  canModify?: boolean;
}

export function ParticipantSelector({
  contractId,
  canModify = false,
}: ParticipantSelectorProps) {
  const {
    participants,
    isLoading,
    addParticipant,
    removeParticipant,
    isAdding,
    isRemoving,
  } = useParticipants(contractId);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [linkUserCompany, setLinkUserCompany] = useState(false);
  const [role, setRole] = useState("additional");

  const { company: userCompany } = useUserCompany(selectedUserId);

  const handleAddParticipant = () => {
    if (!selectedUserId && !selectedCompanyId) {
      toast.error("Please select at least a user or a company");
      return;
    }

    addParticipant(
      {
        contractId,
        userId: selectedUserId || undefined,
        companyId: selectedCompanyId || undefined,
        role,
      },
      {
        onSuccess: () => {
          toast.success("Participant added successfully");
          setSelectedUserId("");
          setSelectedCompanyId("");
          setLinkUserCompany(false);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to add participant");
        },
      }
    );
  };

  const handleRemoveParticipant = (participantId: string) => {
    removeParticipant(
      { participantId },
      {
        onSuccess: () => {
          toast.success("Participant removed successfully");
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to remove participant");
        },
      }
    );
  };

  // If linkUserCompany is enabled and a company exists for the user
  const effectiveCompanyId =
    linkUserCompany && userCompany?.company
      ? userCompany.company.id
      : selectedCompanyId;

  return (
    <div className="space-y-4">
      {/* Add participant form */}
      {canModify && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add participant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">User</Label>
              <UserSelect
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Select a user"
              />
            </div>

            {selectedUserId && userCompany?.company && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="link-company"
                  checked={linkUserCompany}
                  onCheckedChange={(checked: any) =>
                    setLinkUserCompany(checked === true)
                  }
                />
                <Label
                  htmlFor="link-company"
                  className="text-sm font-normal cursor-pointer"
                >
                  Also link company {userCompany.company.name}
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="company-select">Company (optional)</Label>
              <CompanySelect
                value={effectiveCompanyId}
                onChange={setSelectedCompanyId}
                placeholder="Select a company"
                disabled={linkUserCompany && !!userCompany?.company}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-input">Role</Label>
              <Input
                id="role-input"
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                placeholder="e.g. additional, observer, etc."
              />
            </div>

            <Button
              onClick={handleAddParticipant}
              disabled={isAdding || (!selectedUserId && !selectedCompanyId)}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add participant
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Participants list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Participants ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No participants for this contract
            </p>
          ) : (
            <div className="space-y-3">
              {participants.map((participant: any) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onRemove={canModify ? handleRemoveParticipant : undefined}
                  isRemoving={isRemoving}
                  canRemove={canModify && !participant.isPrimary}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
