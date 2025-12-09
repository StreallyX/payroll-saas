"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

type Doc = {
  id: string;
  fileName: string;
  mimeType: string;
  uploadedAt: Date | string;
};

type Props = {
  documents: Doc[];
};

export function DocumentSection({ documents }: Props) {
  const utils = api.useUtils();

  async function downloadDoc(id: string) {
    try {
      const res = await utils.document.getSignedUrl.fetch({ documentId: id });
      window.open(res.url, "_blank");
    } catch (e) {
      toast.error("Unable to download file");
    }
  }

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
                  <span className="font-medium">{doc.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.mimeType} · {format(new Date(doc.uploadedAt), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>

                <Button size="icon" variant="ghost" onClick={() => downloadDoc(doc.id)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any documents yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
