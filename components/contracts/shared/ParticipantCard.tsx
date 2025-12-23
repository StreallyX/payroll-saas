import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, User, X } from "lucide-react";

interface ParticipantCardProps {
  participant: {
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
  onRemove?: (participantId: string) => void;
  isRemoving?: boolean;
  canRemove?: boolean;
}

export function ParticipantCard({
  participant,
  onRemove,
  isRemoving,
  canRemove,
}: ParticipantCardProps) {
  const displayName =
    participant.user?.name ||
    participant.company?.name ||
    "Unnamed participant";

  const displayEmail =
    participant.user?.email ||
    participant.company?.contactEmail ||
    "";

  const displayPhone =
    participant.user?.phone ||
    participant.company?.contactPhone ||
    "";

  const isUser = !!participant.user;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUser ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium">
              {displayName}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {participant.isPrimary && (
              <Badge variant="secondary" className="text-xs">
                Primary
              </Badge>
            )}

            <Badge variant="outline" className="text-xs">
              {participant.role}
            </Badge>

            {canRemove && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(participant.id)}
                disabled={isRemoving}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-1 text-sm">
          {displayEmail && (
            <p className="text-muted-foreground">
              <span className="font-medium">Email:</span> {displayEmail}
            </p>
          )}

          {displayPhone && (
            <p className="text-muted-foreground">
              <span className="font-medium">Phone:</span> {displayPhone}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
