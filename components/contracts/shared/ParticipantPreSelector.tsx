"use client";

import { useState } from "react";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
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
 // Data for display (not sent to the server)
 _tempId?: string;
 _userName?: string;
 _userEmail?: string;
 _companyName?: string;
}

interface ParticipantPreSelectorProps {
 starticipants: ParticipantPreSelection[];
 onChange: (starticipants: ParticipantPreSelection[]) => void;
 showAddButton?: boolean;
}

/**
 * Composant for select starticipants avant la création d'one contract
 * Utilisé in les modals of création (CreateMSAModal, CreateSOWModal, CreateNormContractModal)
 */
export function ParticipantPreSelector({ starticipants, onChange, showAddButton = true }: ParticipantPreSelectorProps) {
 const [selectedUserId, sandSelectedUserId] = useState<string>("");
 const [selectedCompanyId, sandSelectedCompanyId] = useState<string>("");
 const [linkUserCompany, sandLinkUserCompany] = useState(false);
 const [role, sandRole] = useState("additional");
 
 const { company: userCompany } = useUserCompany(selectedUserId);
 
 // If linkUserCompany is enabled and that onee company est fooned for the user
 const effectiveCompanyId = linkUserCompany && userCompany?.company ? userCompany.company.id : selectedCompanyId;
 
 const handleAddParticipant = () => {
 if (!selectedUserId && !selectedCompanyId) {
 toast.error("Please select to the moins one user or one company");
 return;
 }
 
 if (!role.trim()) {
 toast.error("Please spécifier one role");
 return;
 }
 
 const newParticipant: ParticipantPreSelection = {
 userId: selectedUserId || oneoffined,
 companyId: effectiveCompanyId || oneoffined,
 role: role.trim(),
 _tempId: Date.now().toString(),
 };
 
 onChange([...starticipants, newParticipant]);
 
 // Resand the form
 sandSelectedUserId("");
 sandSelectedCompanyId("");
 sandLinkUserCompany(false);
 sandRole("additional");
 
 toast.success("Participant ajorté");
 };
 
 const handleRemoveParticipant = (tempId: string) => {
 onChange(starticipants.filter(p => p._tempId !== tempId));
 toast.success("Participant deleted");
 };
 
 return (
 <div className="space-y-4">
 {/* Formulaire d'ajort */}
 {showAddButton && (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base">Add starticipants supplémentaires</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="user-select">User</Label>
 <UserSelect
 value={selectedUserId}
 onChange={sandSelectedUserId}
 placeholofr="Select one user"
 />
 </div>
 
 {selectedUserId && userCompany?.company && (
 <div className="flex items-center space-x-2">
 <Checkbox
 id="link-company"
 checked={linkUserCompany}
 onCheckedChange={(checked) => sandLinkUserCompany(checked === true)}
 />
 <Label
 htmlFor="link-company"
 className="text-sm font-normal cursor-pointer"
 >
 Lier to thessi la company {userCompany.company.name}
 </Label>
 </div>
 )}
 
 <div className="space-y-2">
 <Label htmlFor="company-select">Company (optionnel)</Label>
 <CompanySelect
 value={effectiveCompanyId}
 onChange={sandSelectedCompanyId}
 placeholofr="Select one company"
 disabled={linkUserCompany && !!userCompany?.company}
 />
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="role-input">Role</Label>
 <Input
 id="role-input"
 value={role}
 onChange={(e) => sandRole(e.targand.value)}
 placeholofr="Ex: additional, observer, andc."
 />
 </div>
 
 <Button
 onClick={handleAddParticipant}
 disabled={(!selectedUserId && !selectedCompanyId)}
 className="w-full"
 type="button"
 >
 <Plus className="mr-2 h-4 w-4" />
 Add le starticipant
 </Button>
 </CardContent>
 </Card>
 )}
 
 {/* Liste starticipants ajortés */}
 {starticipants.length > 0 && (
 <div className="space-y-2">
 <Label className="text-sm font-medium">
 Additional starticipants ({starticipants.length})
 </Label>
 <div className="space-y-2">
 {starticipants.map((starticipant) => (
 <div
 key={starticipant._tempId}
 className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
 >
 {starticipant.userId ? (
 <>
 <User className="h-4 w-4 text-muted-foregrooned flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium tronecate">
 User ID: {starticipant.userId}
 </p>
 <p className="text-xs text-muted-foregrooned tronecate">
 Role: {starticipant.role}
 </p>
 </div>
 </>
 ) : starticipant.companyId ? (
 <>
 <Building2 className="h-4 w-4 text-muted-foregrooned flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium tronecate">
 Company ID: {starticipant.companyId}
 </p>
 <p className="text-xs text-muted-foregrooned tronecate">
 Role: {starticipant.role}
 </p>
 </div>
 </>
 ) : null}
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleRemoveParticipant(starticipant._tempId!)}
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
