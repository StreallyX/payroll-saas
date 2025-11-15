
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Download } from "lucide-react";
import { format } from "date-fns";

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
  metadata?: any;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  onViewDetails?: (log: AuditLog) => void;
}

export function AuditLogTable({ logs, onViewDetails }: AuditLogTableProps) {
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
      case "GENERATE":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "APPROVE":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "REJECT":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Badge className={getActionColor(log.action)} variant="outline">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm truncate">{log.description}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.entityType}</span>
                  {log.entityName && (
                    <span className="text-xs text-gray-500">{log.entityName}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.userName}</span>
                  <span className="text-xs text-gray-500">{log.userRole}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{format(new Date(log.createdAt), "MMM dd, yyyy")}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(log.createdAt), "HH:mm:ss")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">{log.ipAddress || "N/A"}</span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(log)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Export Entry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
