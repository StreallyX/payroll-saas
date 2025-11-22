// components/profile/sections/DocumentSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

type Doc = {
  id: string;
  name: string;
  type?: string | null;
  uploadedAt: Date | string;
  fileUrl?: string | null;
};

type Props = {
  documents: Doc[];
};

export function DocumentSection({ documents }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Documents
        </CardTitle>
        <CardDescription>Documents associated with your profile</CardDescription>
      </CardHeader>
      <CardContent>
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.type || "Document"} · {format(new Date(doc.uploadedAt), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
                {doc.fileUrl && (
                  <Button asChild size="icon" variant="ghost" className="ml-2">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have any documents yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
