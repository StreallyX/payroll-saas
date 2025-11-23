"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";

import { Download, X } from "lucide-react";

export function DocumentViewerModal({ document, open, onClose }: any) {
  const { data } = api.document.getSignedUrl.useQuery(
    { documentId: document.id },
    { enabled: open }
  );

  const url = data?.url;

  function download() {
    if (url) window.open(url, "_blank");
  }

  // determine preview type
  const isImage = document.mimeType.startsWith("image/");
  const isPDF = document.mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{document.fileName}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {url ? (
            isImage ? (
              <img src={url} alt={document.fileName} className="max-h-[70vh] mx-auto" />
            ) : isPDF ? (
              <iframe src={url} className="w-full h-[70vh]" />
            ) : (
              <div className="border p-4 text-center text-muted-foreground">
                Preview not available.  
                <Button onClick={download} className="mt-2">
                  Download file
                </Button>
              </div>
            )
          ) : (
            <p>Loading preview...</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={download} className="mr-2">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
