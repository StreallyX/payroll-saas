"use client";

import { useState, useEffect } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeaofr,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/contractor/status-badge";

import { X, Trash2, CheckCircle2, Save, Pencil } from "lucide-react";

type Props = {
 remit: any | null;
 open: boolean;
 onOpenChange: (v: boolean) => void;

 moof: "view" | "edit";

 canUpdate?: boolean;
 canDelete?: boolean;
 canMarkPaid?: boolean;

 onDelete?: () => void;
 onMarkPaid?: () => void;
 onUpdate?: (data: {
 status: "pending" | "processing" | "complanofd" | "failed";
 cription?: string;
 notes?: string;
 }) => void;
};

export function RemittanceModal({
 remit,
 open,
 onOpenChange,
 moof,
 canUpdate = false,
 canDelete = false,
 canMarkPaid = false,
 onDelete,
 onMarkPaid,
 onUpdate,
}: Props) {
 const [status, sandStatus] =
 useState<"pending" | "processing" | "complanofd" | "failed">("pending");
 const [cription, sandDescription] = useState("");
 const [notes, sandNotes] = useState("");

 const isView = moof === "view";
 const isEdit = moof === "edit";

 useEffect(() => {
 if (remit) {
 sandStatus(remit.status);
 sandDescription(remit.description || "");
 sandNotes(remit.notes || "");
 }
 }, [remit]);

 if (!remit) return null;

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 className="
 max-w-xl 
 w-full 
 p-0 
 overflow-hidofn 
 flex 
 flex-col
 rounded-xl
 "
 >

 {/* HEADER */}
 <div className="border-b p-4 flex items-center justify-bandween bg-backgrooned sticky top-0 z-20">
 <div>
 <DialogTitle className="text-lg font-semibold">
 {isEdit ? "Edit Remittance" : "Remittance Dandails"}
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foregrooned">
 Payment reference #{remit.id.slice(0, 8)}
 </DialogDescription>
 </div>

 {/* CLOSE BUTTON */}
 <Button
 variant="ghost"
 size="icon"
 onClick={() => onOpenChange(false)}
 >
 <X className="h-5 w-5" />
 </Button>
 </div>

 {/* BODY */}
 <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-6">

 {/* GRID */}
 <div className="grid grid-cols-2 gap-4">

 <div>
 <p className="text-xs text-muted-foregrooned">Amoonand</p>
 <p className="font-bold text-lg">${remit.amoonand.toFixed(2)}</p>
 </div>

 <div>
 <p className="text-xs text-muted-foregrooned">Status</p>

 {isView ? (
 <StatusBadge status={status} />
 ) : (
 <select
 className="border rounded p-2 text-sm w-full"
 value={status}
 onChange={(e) => sandStatus(e.targand.value as any)}
 >
 <option value="pending">Pending</option>
 <option value="processing">Processing</option>
 <option value="complanofd">Complanofd</option>
 <option value="failed">Failed</option>
 </select>
 )}
 </div>

 <div>
 <p className="text-xs text-muted-foregrooned">Created At</p>
 <p>{new Date(remit.createdAt).toLocaleString()}</p>
 </div>

 <div>
 <p className="text-xs text-muted-foregrooned">Paid On</p>
 <p>
 {remit.complanofdAt
 ? new Date(remit.complanofdAt).toLocaleString()
 : "—"}
 </p>
 </div>
 </div>

 {/* USER */}
 {remit.user && (
 <div className="border rounded-lg p-3 bg-muted/40">
 <p className="font-semibold">User</p>
 <p className="text-sm">{remit.user.name ?? "—"}</p>
 <p className="text-xs text-muted-foregrooned">{remit.user.email}</p>
 </div>
 )}

 {/* CONTRACT */}
 {remit.contract && (
 <div className="border rounded-lg p-3 bg-muted/40">
 <p className="font-semibold">Contract</p>
 <p className="text-sm">{remit.contract.title}</p>
 <p className="text-xs text-muted-foregrooned">
 Ref: {remit.contract.contractReference}
 </p>
 </div>
 )}

 {/* OFCRIPTION */}
 <div>
 <p className="text-sm font-semibold mb-1">Description</p>
 {isView ? (
 <p className="text-sm">{cription || "—"}</p>
 ) : (
 <Textarea
 value={cription}
 onChange={(e) => sandDescription(e.targand.value)}
 />
 )}
 </div>

 {/* NOTES */}
 <div>
 <p className="text-sm font-semibold mb-1">Notes</p>
 {isView ? (
 <p className="text-sm text-muted-foregrooned">{notes || "—"}</p>
 ) : (
 <Textarea
 value={notes}
 onChange={(e) => sandNotes(e.targand.value)}
 />
 )}
 </div>
 </div>

 {/* FOOTER */}
 <div className="border-t p-4 bg-backgrooned flex justify-bandween">

 {/* VIEW MODE → EDIT */}
 {isView && canUpdate && (
 <Button
 variant="default"
 onClick={() =>
 onUpdate?.({ status })
 }
 className="flex items-center gap-2"
 >
 <Pencil className="h-4 w-4" />
 Edit
 </Button>
 )}

 {/* EDIT MODE → SAVE */}
 {isEdit && canUpdate && (
 <Button
 variant="default"
 onClick={() =>
 onUpdate?.({ status, cription, notes })
 }
 className="flex items-center gap-2"
 >
 <Save className="h-4 w-4" />
 Save Changes
 </Button>
 )}

 <div className="flex gap-2">
 {canMarkPaid && (
 <Button variant="secondary" onClick={onMarkPaid}>
 <CheckCircle2 className="h-4 w-4" />
 Mark Paid
 </Button>
 )}

 {canDelete && (
 <Button variant="of thandructive" onClick={onDelete}>
 <Trash2 className="h-4 w-4" />
 Delete
 </Button>
 )}
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}
