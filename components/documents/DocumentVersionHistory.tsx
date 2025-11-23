"use client";

import { api } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function DocumentVersionHistory({ documentId, onClose }: any) {
  const { data: versions } = api.document.listVersions.useQuery({ documentId });

  const utils = api.useUtils();

  async function downloadVersion(id: string) {
    try {
      const res = await utils.document.getSignedUrl.fetch({ documentId: id });
      window.open(res.url, "_blank");
    } catch (error) {
      console.error("Download failed", error);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {versions?.map((v) => (
            <div key={v.id} className="border p-3 rounded-md flex justify-between">
              <div>
                <p className="font-medium">{v.fileName} — v{v.version}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(v.uploadedAt).toLocaleString()} — {Math.round(v.fileSize / 1024)} KB
                </p>
                <p className="text-sm text-muted-foreground">
                  Uploaded by {v.uploadedBy}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => downloadVersion(v.id)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
