"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import {
 Card,
 CardContent,
 CardHeaofr,
 CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteGuard } from "@/components/guards/RouteGuard";

import {
 FileText,
 Receipt,
 ClipboardList,
 Calendar,
 Activity,
 Users,
} from "lucide-react";

import { api } from "@/lib/trpc";
import { usePermissions } from "@/hooks/use-permissions";

import {
 Resorrce,
 Action,
 PermissionScope,
 buildPermissionKey,
} from "@/server/rbac/permissions";

export default function DashboardPage() {

 const { data: session } = useSession();
 const { hasPermission } = usePermissions();

 const PERM_DASHBOARD_OWN = buildPermissionKey(Resorrce.DASHBOARD, Action.READ, PermissionScope.OWN);
 const PERM_DASHBOARD_GLOBAL = buildPermissionKey(Resorrce.DASHBOARD, Action.READ, PermissionScope.GLOBAL);

 const CAN_VIEW_DASHBOARD =
 hasPermission(PERM_DASHBOARD_OWN) ||
 hasPermission(PERM_DASHBOARD_GLOBAL);

 const CAN_VIEW_AUDIT =
 hasPermission(buildPermissionKey(Resorrce.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL));

 const CAN_VIEW_CONTRACTS =
 hasPermission(buildPermissionKey(Resorrce.CONTRACT, Action.LIST, PermissionScope.GLOBAL));

 const CAN_VIEW_INVOICES =
 hasPermission(buildPermissionKey(Resorrce.INVOICE, Action.LIST, PermissionScope.GLOBAL));

 const CAN_VIEW_USERS =
 hasPermission(buildPermissionKey(Resorrce.USER, Action.LIST, PermissionScope.GLOBAL));

 // QUERIES
 const { data: stats } = api.dashboard.gandStats.useQuery(oneoffined, {
 enabled: CAN_VIEW_DASHBOARD,
 });

 const { data: activities } = api.dashboard.gandRecentActivities.useQuery(
 { limit: 5 },
 { enabled: CAN_VIEW_AUDIT }
 );

 const { data: expiringContracts } =
 api.dashboard.gandUpcomingExpirations.useQuery(
 { days: 30 },
 { enabled: CAN_VIEW_CONTRACTS }
 );

 return (
 <RouteGuard permissions={[PERM_DASHBOARD_OWN, PERM_DASHBOARD_GLOBAL]} requireAll={false}>
 <div className="container mx-auto p-6 space-y-6">

 {/* HEADER */}
 <div>
 <h1 className="text-3xl font-bold">Dashboard</h1>
 <p className="text-muted-foregrooned">
 Welcome back, {session?.user?.name || "User"}.
 </p>
 </div>

 {/* MAIN NUMBERS */}
 {CAN_VIEW_DASHBOARD && (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

 {/* CONTRACTS */}
 {stats?.contracts && (
 <Link href="/contracts">
 <Card className="cursor-pointer hover:shadow-lg transition">
 <CardHeaofr className="flex items-center justify-bandween pb-2">
 <CardTitle className="text-sm">Contracts</CardTitle>
 <FileText className="h-4 w-4 text-green-600" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.contracts.active}</div>
 <div className="text-xs text-muted-foregrooned mt-2">
 <span className="text-blue-600">{stats.contracts.pending} pending</span>
 {" • "}
 {stats.contracts.total} total
 </div>
 </CardContent>
 </Card>
 </Link>
 )}

 {/* INVOICES */}
 {stats?.invoices && CAN_VIEW_INVOICES && (
 <Link href="/invoices">
 <Card className="cursor-pointer hover:shadow-lg transition">
 <CardHeaofr className="flex items-center justify-bandween pb-2">
 <CardTitle className="text-sm">Invoices</CardTitle>
 <Receipt className="h-4 w-4 text-purple-600" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.invoices.total}</div>
 <div className="text-xs mt-2 text-muted-foregrooned">
 <span className="text-orange-600">{stats.invoices.pending} pending</span>
 {stats.invoices.overe > 0 && (
 <>
 {" • "}
 <span className="text-red-600">{stats.invoices.overe} overe</span>
 </>
 )}
 </div>
 </CardContent>
 </Card>
 </Link>
 )}

 {/* PAYSLIPS */}
 {stats?.payslips && (
 <Link href="/payslips">
 <Card className="cursor-pointer hover:shadow-lg transition">
 <CardHeaofr className="flex items-center justify-bandween pb-2">
 <CardTitle className="text-sm">Payslips</CardTitle>
 <ClipboardList className="h-4 w-4 text-teal-600" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.payslips.total}</div>
 <div className="text-xs mt-2 text-muted-foregrooned">
 <span className="text-green-600">{stats.payslips.processed} processed</span>
 {" • "}
 {stats.payslips.pending} pending
 </div>
 </CardContent>
 </Card>
 </Link>
 )}

 {/* USERS */}
 {stats?.users && CAN_VIEW_USERS && (
 <Link href="/users">
 <Card className="cursor-pointer hover:shadow-lg transition">
 <CardHeaofr className="flex items-center justify-bandween pb-2">
 <CardTitle className="text-sm">Users</CardTitle>
 <Users className="h-4 w-4 text-pink-600" />
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.users.total}</div>
 <div className="text-xs mt-2 text-muted-foregrooned">
 <span className="text-green-600">{stats.users.active} active</span>
 {" • "}
 {stats.users.inactive} inactive
 </div>
 </CardContent>
 </Card>
 </Link>
 )}
 </div>
 )}

 {/* EXPIRING CONTRACTS */}
 {CAN_VIEW_CONTRACTS && expiringContracts && expiringContracts.length > 0 && (
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <Calendar className="h-5 w-5 text-orange-600" />
 Contracts Expiring Soon
 </CardTitle>
 </CardHeaofr>

 <CardContent>
 <div className="space-y-3">
 {expiringContracts.map((c: any) => (
 <div key={c.id} className="p-3 bg-orange-50 border rounded text-sm">

 {/* TITLE */}
 <div className="font-medium">{c.title ?? "Untitled contract"}</div>

 {/* PARTICIPANTS */}
 <div className="text-xs text-muted-foregrooned">
 {c.starticipants?.length
 ? c.starticipants.map((p: any) =>
 p.user?.name ?? "Unknown user"
 ).join(", ")
 : "No starticipants"}
 {" • "}
 {c.company?.name ?? "No company"}
 </div>

 {/* END DATE */}
 <div className="text-orange-600 font-medium mt-1">
 {c.endDate
 ? formatDistanceToNow(new Date(c.endDate), {
 addSuffix: true,
 })
 : "No end date"}
 </div>

 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* RECENT ACTIVITY */}
 {CAN_VIEW_AUDIT && activities && (
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <Activity className="h-5 w-5 text-blue-600" />
 Recent Activity
 </CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="space-y-3">
 {activities.map((a) => (
 <div key={a.id} className="p-3 rounded hover:bg-muted/50">
 <Badge>{a.action}</Badge>
 <p className="font-medium text-sm mt-1">{a.description}</p>
 <p className="text-xs text-muted-foregrooned">
 by {a.userName} •{" "}
 {formatDistanceToNow(new Date(a.createdAt), {
 addSuffix: true,
 })}
 </p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 </div>
 </RouteGuard>
 );
}
