"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSelect } from "./UserSelect";
import { CompanySelect } from "./CompanySelect";
import { CONTRACT_ROLES } from "./ParticipantSelector";
import { Plus, X, User, Building2, Info } from "lucide-react";
import { useUserCompany } from "@/hooks/contracts/useUserCompany";
import { toast } from "sonner";

export interface ParticipantPreSelection {
  userId?: string;
  companyId?: string;
  role: string;
  // Display-only data (not sent to the server)
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
 * Component used to preselect participants before contract creation
 * Used in creation modals (CreateMSAModal, CreateSOWModal, CreateNormContractModal)
 */
export function ParticipantPreSelector({
  participants,
  onChange,
  showAddButton = true,
}: ParticipantPreSelectorProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [linkUserCompany, setLinkUserCompany] = useState(false);
  const [role, setRole] = useState<string>("");

  const { company: userCompany } = useUserCompany(selectedUserId);

  // If linkUserCompany is enabled and a company exists for the user
  const effectiveCompanyId =
    linkUserCompany && userCompany?.company
      ? userCompany.company.id
      : selectedCompanyId;

  const handleAddParticipant = () => {
    if (!selectedUserId && !selectedCompanyId) {
      toast.error("Please select at least a user or a company");
      return;
    }

    if (!role) {
      toast.error("Please select a contract role");
      return;
    }

    const newParticipant: ParticipantPreSelection = {
      userId: selectedUserId || undefined,
      companyId: effectiveCompanyId || undefined,
      role: role,
      _tempId: Date.now().toString(),
    };

    onChange([...participants, newParticipant]);

    // Reset form
    setSelectedUserId("");
    setSelectedCompanyId("");
    setLinkUserCompany(false);
    setRole("");

    toast.success("Participant added");
  };

  const handleRemoveParticipant = (tempId: string) => {
    onChange(participants.filter((p) => p._tempId !== tempId));
    toast.success("Participant removed");
  };

  return (
    <div className="space-y-4">
      {/* Add participant form */}
      {showAddButton && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Add additional participants
            </CardTitle>
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
                  onCheckedChange={(checked) =>
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
              disabled={(!selectedUserId && !selectedCompanyId) || !role}
              className="w-full"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add participant
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Added participants list */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Additional participants ({participants.length})
          </Label>
          <div className="space-y-2">
            {participants.map((participant) => {
              const roleConfig = CONTRACT_ROLES.find(r => r.value === participant.role);
              const RoleIcon = roleConfig?.icon || User;

              return (
                <div
                  key={participant._tempId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  {participant.userId ? (
                    <>
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant._userName || `User: ${participant.userId.slice(0, 8)}...`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleConfig?.badge || ""}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig?.label || participant.role}
                          </Badge>
                          {participant.companyId && (
                            <span className="text-xs text-muted-foreground">
                              + Company linked
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : participant.companyId ? (
                    <>
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant._companyName || `Company: ${participant.companyId.slice(0, 8)}...`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleConfig?.badge || ""}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig?.label || participant.role}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRemoveParticipant(participant._tempId!)
                    }
                    className="flex-shrink-0"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
