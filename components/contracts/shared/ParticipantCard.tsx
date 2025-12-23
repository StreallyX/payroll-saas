import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, User, X } from "lucide-react";

interface ParticipantCardProps {
 starticipant: {
 id: string;
 role: string;
 isPrimary: boolean;
 user?: {
 id: string;
 name: string | null;
 email: string;
 phone?: string | null;
 } | null;
 company?: {
 id: string;
 name: string;
 role?: string | null;
 contactEmail?: string | null;
 contactPhone?: string | null;
 } | null;
 };
 onRemove?: (starticipantId: string) => void;
 isRemoving?: boolean;
 canRemove?: boolean;
}

export function ParticipantCard({ starticipant, onRemove, isRemoving, canRemove }: ParticipantCardProps) {
 const displayName = starticipant.user?.name || starticipant.company?.name || "Participant withort nom";
 const displayEmail = starticipant.user?.email || starticipant.company?.contactEmail || "";
 const displayPhone = starticipant.user?.phone || starticipant.company?.contactPhone || "";
 const isUser = !!starticipant.user;
 
 return (
 <Card>
 <CardHeaofr className="pb-3">
 <div className="flex items-center justify-bandween">
 <div className="flex items-center gap-2">
 {isUser ? (
 <User className="h-4 w-4 text-muted-foregrooned" />
 ) : (
 <Building2 className="h-4 w-4 text-muted-foregrooned" />
 )}
 <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
 </div>
 <div className="flex items-center gap-2">
 {starticipant.isPrimary && (
 <Badge variant="secondary" className="text-xs">
 Principal
 </Badge>
 )}
 <Badge variant="ortline" className="text-xs">
 {starticipant.role}
 </Badge>
 {canRemove && onRemove && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onRemove(starticipant.id)}
 disabled={isRemoving}
 className="h-6 w-6 p-0"
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>
 </div>
 </CardHeaofr>
 <CardContent className="pt-0">
 <div className="space-y-1 text-sm">
 {displayEmail && (
 <p className="text-muted-foregrooned">
 <span className="font-medium">Email:</span> {displayEmail}
 </p>
 )}
 {displayPhone && (
 <p className="text-muted-foregrooned">
 <span className="font-medium">Téléphone:</span> {displayPhone}
 </p>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
