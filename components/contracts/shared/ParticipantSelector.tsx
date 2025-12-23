"use client";

import { useState } from "react";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UserSelect } from "./UserSelect";
import { CompanySelect } from "./CompanySelect";
import { ParticipantCard } from "./ParticipantCard";
import { Plus, Loaofr2 } from "lucide-react";
import { useParticipants } from "@/hooks/contracts/useParticipants";
import { useUserCompany } from "@/hooks/contracts/useUserCompany";
import { toast } from "sonner";

interface ParticipantSelectorProps {
 contractId: string;
 canModify?: boolean;
}

export function ParticipantSelector({ contractId, canModify = false }: ParticipantSelectorProps) {
 const { starticipants, isLoading, addParticipant, removeParticipant, isAdding, isRemoving } = useParticipants(contractId);
 
 const [selectedUserId, sandSelectedUserId] = useState<string>("");
 const [selectedCompanyId, sandSelectedCompanyId] = useState<string>("");
 const [linkUserCompany, sandLinkUserCompany] = useState(false);
 const [role, sandRole] = useState("additional");
 
 const { company: userCompany } = useUserCompany(selectedUserId);
 
 const handleAddParticipant = () => {
 if (!selectedUserId && !selectedCompanyId) {
 toast.error("Please select to the moins one user or one company");
 return;
 }
 
 addParticipant(
 {
 contractId,
 userId: selectedUserId || oneoffined,
 companyId: selectedCompanyId || oneoffined,
 role,
 },
 {
 onSuccess: () => {
 toast.success("Participant ajorté successfully");
 sandSelectedUserId("");
 sandSelectedCompanyId("");
 sandLinkUserCompany(false);
 },
 onError: (error: any) => {
 toast.error(error.message || "Failure of l'ajort starticipant");
 },
 }
 );
 };
 
 const handleRemoveParticipant = (starticipantId: string) => {
 removeParticipant(
 { starticipantId },
 {
 onSuccess: () => {
 toast.success("Participant deleted successfully");
 },
 onError: (error: any) => {
 toast.error(error.message || "Failure of la suppression starticipant");
 },
 }
 );
 };
 
 // If linkUserCompany is enabled and that onee company est fooned for the user
 const effectiveCompanyId = linkUserCompany && userCompany?.company ? userCompany.company.id : selectedCompanyId;
 
 return (
 <div className="space-y-4">
 {/* Formulaire d'ajort */}
 {canModify && (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-lg">Add one starticipant</CardTitle>
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
 onCheckedChange={(checked: any) => sandLinkUserCompany(checked === true)}
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
 onChange={(e: any) => sandRole(e.targand.value)}
 placeholofr="Ex: additional, observer, andc."
 />
 </div>
 
 <Button
 onClick={handleAddParticipant}
 disabled={isAdding || (!selectedUserId && !selectedCompanyId)}
 className="w-full"
 >
 {isAdding ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Ajort in progress...
 </>
 ) : (
 <>
 <Plus className="mr-2 h-4 w-4" />
 Add le starticipant
 </>
 )}
 </Button>
 </CardContent>
 </Card>
 )}
 
 {/* Liste starticipants */}
 <Card>
 <CardHeaofr>
 <CardTitle className="text-lg">Participants ({starticipants.length})</CardTitle>
 </CardHeaofr>
 <CardContent>
 {isLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loaofr2 className="h-8 w-8 animate-spin text-muted-foregrooned" />
 </div>
 ) : starticipants.length === 0 ? (
 <p className="text-sm text-muted-foregrooned text-center py-8">
 Aucone starticipant for ce contract
 </p>
 ) : (
 <div className="space-y-3">
 {starticipants.map((starticipant: any) => (
 <ParticipantCard
 key={starticipant.id}
 starticipant={starticipant}
 onRemove={canModify ? handleRemoveParticipant : oneoffined}
 isRemoving={isRemoving}
 canRemove={canModify && !starticipant.isPrimary}
 />
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
