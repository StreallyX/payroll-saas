"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Building2, User } from "lucide-react";

interface Participant {
  role: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  company?: {
    name?: string | null;
  };
}

interface TimesheetParticipantDiagramProps {
  participants: Participant[];
}

export function TimesheetParticipantDiagram({ participants }: TimesheetParticipantDiagramProps) {
  // Find contractor and agency
  const contractor = participants.find(p => p.role === "contractor");
  const agency = participants.find(p => p.role === "agency");

  if (!contractor && !agency) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workflow Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8 py-6">
          {/* Contractor */}
          {contractor && (
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-blue-500">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                    {getInitials(contractor.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5">
                  <User className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">{contractor.user?.name || "Contractor"}</p>
                <p className="text-xs text-muted-foreground">{contractor.user?.email}</p>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  <User className="h-3 w-3" />
                  Contractor
                </div>
              </div>
            </div>
          )}

          {/* Arrow */}
          {contractor && agency && (
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="h-8 w-8 text-green-600 animate-pulse" strokeWidth={2.5} />
              <div className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Sends Invoice
              </div>
            </div>
          )}

          {/* Agency */}
          {agency && (
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-purple-500">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-lg font-semibold">
                    {getInitials(agency.company?.name || agency.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1.5">
                  <Building2 className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">{agency.company?.name || agency.user?.name || "Agency"}</p>
                {agency.user?.email && (
                  <p className="text-xs text-muted-foreground">{agency.user.email}</p>
                )}
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  <Building2 className="h-3 w-3" />
                  Agency
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            When approved, the contractor submits an invoice to the agency for payment processing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
