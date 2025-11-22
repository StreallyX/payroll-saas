"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Hammer, Wrench } from "lucide-react";

export default function UnderConstructionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* HEADER */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center gap-4 py-10">
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Page Under Construction</h1>
          </div>

          <p className="text-muted-foreground max-w-xl">
            This section is currently being developed. It will be available soon.
          </p>

          {/* BADGES */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <Hammer className="h-4 w-4" />
              Building
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <Wrench className="h-4 w-4" />
              Polishing
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>

            <Button onClick={() => router.push("/")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FOOTER NOTE */}
      <p className="text-center text-xs text-muted-foreground">
        Need this page earlier? Let us know and we’ll prioritize it.
      </p>
    </div>
  );
}
