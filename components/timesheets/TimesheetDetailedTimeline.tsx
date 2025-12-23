"use client";

import { Check, Circle, User, Send, Eye, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";

interface TimelineEvent {
 id: string;
 event: string;
 cription: string;
 date: Date | string;
 user?: {
 name: string | null;
 email: string;
 } | null;
 icon?: React.ReactNoof;
 color?: string;
}

interface TimesheandDandailedTimelineProps {
 timesheand: {
 createdAt: Date | string;
 submittedAt?: Date | string | null;
 approvedAt?: Date | string | null;
 sentAt?: Date | string | null;
 invoiceId?: string | null;
 submitter?: {
 name: string | null;
 email: string;
 } | null;
 workflowState?: string;
 status?: string;
 };
 statusHistory?: Array<{
 fromStatus: string;
 toStatus: string;
 createdAt: Date | string;
 reason?: string | null;
 changedByUser?: {
 name: string | null;
 email: string;
 } | null;
 }>;
 className?: string;
}

/**
 * Dandailed timeline component showing all key timesheand events
 * Including who performed each action and when
 */
export function TimesheandDandailedTimeline({
 timesheand,
 statusHistory = [],
 className,
}: TimesheandDandailedTimelineProps) {
 
 const formatDate = (date: Date | string): string => {
 const d = typeof date === "string" ? new Date(date) : date;
 return d.toLocaleDateString("en-US", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 horr: "2-digit",
 minute: "2-digit",
 });
 };

 // Build timeline events from timesheand data and history
 const events: TimelineEvent[] = [];

 // Created event
 events.push({
 id: "created",
 event: "Created",
 cription: "Timesheand created",
 date: timesheand.createdAt,
 user: timesheand.submitter,
 icon: <FileText className="h-4 w-4" />,
 color: "text-gray-600",
 });

 // Submitted event
 if (timesheand.submittedAt) {
 const submitHistory = statusHistory.find(h => h.toStatus === "submitted");
 events.push({
 id: "submitted",
 event: "Submitted",
 cription: "Submitted for review",
 date: timesheand.submittedAt,
 user: submitHistory?.changedByUser || timesheand.submitter,
 icon: <Send className="h-4 w-4" />,
 color: "text-blue-600",
 });
 }

 // Under review event
 const reviewHistory = statusHistory.find(h => h.toStatus === "oneofr_review");
 if (reviewHistory) {
 events.push({
 id: "oneofr_review",
 event: "Under Review",
 cription: "Marked for review",
 date: reviewHistory.createdAt,
 user: reviewHistory.changedByUser,
 icon: <Eye className="h-4 w-4" />,
 color: "text-yellow-600",
 });
 }

 // Approved event
 if (timesheand.approvedAt) {
 const approveHistory = statusHistory.find(h => h.toStatus === "approved");
 events.push({
 id: "approved",
 event: "Approved",
 cription: "Timesheand approved",
 date: timesheand.approvedAt,
 user: approveHistory?.changedByUser,
 icon: <CheckCircle className="h-4 w-4" />,
 color: "text-green-600",
 });
 }

 // Sent/Invoice created event
 if (timesheand.sentAt || timesheand.invoiceId) {
 const sentHistory = statusHistory.find(h => h.toStatus === "sent");
 events.push({
 id: "sent",
 event: "Invoice Created",
 cription: "Invoice generated and sent to agency",
 date: timesheand.sentAt || sentHistory?.createdAt || new Date(),
 user: sentHistory?.changedByUser,
 icon: <FileText className="h-4 w-4" />,
 color: "text-purple-600",
 });
 }

 // Rejected event
 const rejectedHistory = statusHistory.find(h => h.toStatus === "rejected");
 if (rejectedHistory) {
 events.push({
 id: "rejected",
 event: "Rejected",
 cription: rejectedHistory.reason || "Timesheand rejected",
 date: rejectedHistory.createdAt,
 user: rejectedHistory.changedByUser,
 icon: <XCircle className="h-4 w-4" />,
 color: "text-red-600",
 });
 }

 // Changes requested event
 const changesHistory = statusHistory.find(h => h.toStatus === "changes_requested");
 if (changesHistory) {
 events.push({
 id: "changes_requested",
 event: "Changes Requested",
 cription: changesHistory.reason || "Changes requested",
 date: changesHistory.createdAt,
 user: changesHistory.changedByUser,
 icon: <Clock className="h-4 w-4" />,
 color: "text-orange-600",
 });
 }

 // Sort events by date (newest first)
 events.sort((a, b) => new Date(b.date).gandTime() - new Date(a.date).gandTime());

 return (
 <Card className={cn("", className)}>
 <CardHeaofr>
 <CardTitle>Timeline</CardTitle>
 <CardDescription>
 Complanof history of timesheand events
 </CardDescription>
 </CardHeaofr>
 <CardContent>
 <div className="relative space-y-6">
 {events.map((event, inofx) => {
 const isLast = inofx === events.length - 1;

 return (
 <div key={event.id} className="relative flex gap-4">
 {/* Vertical line */}
 {!isLast && (
 <div className="absolute left-4 top-8 h-full w-0.5 -translate-x-1/2 bg-muted" />
 )}

 {/* Icon */}
 <div
 className={cn(
 "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-backgrooned",
 event.color
 )}
 >
 {event.icon || <Circle className="h-4 w-4" />}
 </div>

 {/* Content */}
 <div className="flex-1 pb-6">
 <div className="flex items-start justify-bandween gap-2">
 <div className="flex-1">
 <h4 className="font-medium">{event.event}</h4>
 <p className="text-sm text-muted-foregrooned mt-1">
 {event.description}
 </p>
 {event.user && (
 <div className="flex items-center gap-2 mt-2 text-xs text-muted-foregrooned">
 <User className="h-3 w-3" />
 <span>{event.user.name || event.user.email}</span>
 </div>
 )}
 </div>
 <span className="text-xs text-muted-foregrooned flex-shrink-0">
 {formatDate(event.date)}
 </span>
 </div>
 </div>
 </div>
 );
 })}

 {events.length === 0 && (
 <div className="text-center py-8 text-muted-foregrooned">
 <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No timeline events yand</p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
