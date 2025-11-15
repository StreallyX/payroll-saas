
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { User, Calendar, Globe, FileText, Info } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityName?: string | null;
  userName: string;
  userRole: string;
  description: string;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
}

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetailsDialog({
  log,
  open,
  onClose,
}: AuditLogDetailsDialogProps) {
  if (!log) return null;

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-700 border-green-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200";
      case "EXPORT":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>Complete information about this action</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action & Entity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Action</label>
              <div>
                <Badge className={getActionColor(log.action)} variant="outline">
                  {log.action}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Entity Type</label>
              <p className="text-sm font-medium">{log.entityType}</p>
            </div>
          </div>

          {/* Entity Name */}
          {log.entityName && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Entity Name</label>
              <p className="text-sm">{log.entityName}</p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <p className="text-sm bg-gray-50 p-3 rounded-md">{log.description}</p>
          </div>

          <Separator />

          {/* User Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Name</label>
                <p className="text-sm">{log.userName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Role</label>
                <p className="text-sm">{log.userRole}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Technical Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Timestamp</label>
                <div className="text-sm">
                  <p>{format(new Date(log.createdAt), "MMMM dd, yyyy")}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.createdAt), "HH:mm:ss")}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">IP Address</label>
                <p className="text-sm font-mono">{log.ipAddress || "N/A"}</p>
              </div>
            </div>

            {log.userAgent && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">User Agent</label>
                <p className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
                  {log.userAgent}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Additional Data
                </h3>
                <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
