"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import { api } from "@/lib/trpc"
import { LoadingState } from "@/components/shared/loading-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AgencyViewModal({ open, onOpenChange, agency }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agency: any
}) {
  const { data, isLoading } = api.agency.getById.useQuery(
    { id: agency?.id || "" },
    { enabled: open && Boolean(agency?.id) }
  )

  if (!agency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {data?.name || agency.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Loading agency details..." />
        ) : (
          <div className="space-y-6">
            {/* Infos générales */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">{data?.status}</Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Email: {data?.contactEmail || "-"}</p>
                    <p>Phone: {data?.contactPhone || "-"}</p>
                    <p>City: {data?.city || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contractors */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">
                    Contractors ({data?.contractors?.length || 0})
                  </h3>
                </div>

                {(!data?.contractors || data.contractors.length === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    No contractors assigned to this agency.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.contractors.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.user?.name || c.name || "-"}</TableCell>
                            <TableCell>{c.user?.email || c.email || "-"}</TableCell>
                            <TableCell>{c.status || "active"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
