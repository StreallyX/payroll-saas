"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSelect } from "./UserSelect";
import { CompanySelect } from "./CompanySelect";
import { ParticipantCard } from "./ParticipantCard";
import { Plus, Loader2, Info, PenTool, Eye, CheckCircle, Users } from "lucide-react";
import { useParticipants } from "@/hooks/contracts/useParticipants";
import { useUserCompany } from "@/hooks/contracts/useUserCompany";
import { toast } from "sonner";

// Contract participant roles with descriptions
export const CONTRACT_ROLES = [
  {
    value: "signer",
    label: "Signer",
    description: "Must sign the contract for it to be valid",
    icon: PenTool,
    color: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    value: "approver",
    label: "Approver",
    description: "Must approve the contract before it can proceed",
    icon: CheckCircle,
    color: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view the contract but cannot modify or sign",
    icon: Eye,
    color: "text-gray-600",
    badge: "bg-gray-100 text-gray-700",
  },
  {
    value: "stakeholder",
    label: "Stakeholder",
    description: "Receives notifications about contract changes",
    icon: Users,
    color: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
] as const;

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
  const [role, setRole] = useState<string>("");

  const { company: userCompany } = useUserCompany(selectedUserId);

  const handleAddParticipant = () => {
    if (!selectedUserId && !selectedCompanyId) {
      toast.error("Please select at least a user or a company");
      return;
    }

    if (!role) {
      toast.error("Please select a contract role");
      return;
    }

    addParticipant(
      {
        contractId,
        userId: selectedUserId || undefined,
        companyId: effectiveCompanyId || undefined,
        role,
      },
      {
        onSuccess: () => {
          toast.success("Participant added successfully");
          setSelectedUserId("");
          setSelectedCompanyId("");
          setLinkUserCompany(false);
          setRole("");
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add participant</CardTitle>
            <CardDescription className="text-xs">
              Select users and assign their role on this contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">User</Label>
              <UserSelect
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Select a user"
              />
              <p className="text-xs text-muted-foreground">
                User&apos;s system role (Admin, Agency, etc.) is shown for reference
              </p>
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
              <Label htmlFor="role-select">Contract Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract role..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_ROLES.map((contractRole) => {
                    const Icon = contractRole.icon;
                    return (
                      <SelectItem key={contractRole.value} value={contractRole.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${contractRole.color}`} />
                          <span className="font-medium">{contractRole.label}</span>
                          <span className="text-xs text-muted-foreground">
                            - {contractRole.description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Role description helper */}
              {role && (
                <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs">
                  <Info className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {CONTRACT_ROLES.find(r => r.value === role)?.description}
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handleAddParticipant}
              disabled={isAdding || (!selectedUserId && !selectedCompanyId) || !role}
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
