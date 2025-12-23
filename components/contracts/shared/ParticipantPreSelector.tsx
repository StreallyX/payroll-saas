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
  const [role, setRole] = useState("additional");

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

    if (!role.trim()) {
      toast.error("Please specify a role");
      return;
    }

    const newParticipant: ParticipantPreSelection = {
      userId: selectedUserId || undefined,
      companyId: effectiveCompanyId || undefined,
      role: role.trim(),
      _tempId: Date.now().toString(),
    };

    onChange([...participants, newParticipant]);

    // Reset form
    setSelectedUserId("");
    setSelectedCompanyId("");
    setLinkUserCompany(false);
    setRole("additional");

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
          <CardHeader>
            <CardTitle className="text-base">
              Add additional participants
            </CardTitle>
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
              <Label htmlFor="role-input">Role</Label>
              <Input
                id="role-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. additional, observer, etc."
              />
            </div>

            <Button
              onClick={handleAddParticipant}
              disabled={!selectedUserId && !selectedCompanyId}
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
                        User ID: {participant.userId}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Role: {participant.role}
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
                        Role: {participant.role}
                      </p>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
