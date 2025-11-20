"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Building2, 
  ClipboardList, 
  UserCheck, 
  Receipt,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { RouteGuard } from "@/components/guards/RouteGuard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { permissions, hasPermission } = usePermissions();

  const hasDashboardAccess =
  hasPermission("dashboard.read.global") ||
  hasPermission("dashboard.read.own");

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery();

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = api.dashboard.getRecentActivities.useQuery(
    { limit: 5 },
    { enabled: hasPermission("audit.read.global") }
  );

  // Fetch upcoming contract expirations
  const { data: expiringContracts, isLoading: expirationsLoading } = api.dashboard.getUpcomingExpirations.useQuery(
    { days: 30 },
    { enabled: hasPermission("contracts.read.global") }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <RouteGuard permission="dashboard.read.own">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}! Here's an overview of your workspace.
          </p>
        </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Contractors Card */}
        {stats?.contractors && (
          <Link href="/team/contractors">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contractors</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contractors.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-green-600 font-medium">{stats.contractors.active} active</span>
                  <span>•</span>
                  <span>{stats.contractors.inactive} inactive</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Contracts Card */}
        {stats?.contracts && (
          <Link href="/contracts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contracts</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contracts.active}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-blue-600 font-medium">{stats.contracts.pending} pending</span>
                  <span>•</span>
                  <span>{stats.contracts.total} total</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Invoices Card */}
        {stats?.invoices && (
          <Link href="/invoices">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                <Receipt className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.invoices.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-orange-600 font-medium">{stats.invoices.pending} pending</span>
                  {stats.invoices.overdue > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 font-medium">{stats.invoices.overdue} overdue</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Agencies Card */}
        {stats?.agencies && (
          <Link href="/team/agencies">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agencies</CardTitle>
                <Building2 className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agencies.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-green-600 font-medium">{stats.agencies.active} active</span>
                  <span>•</span>
                  <span>{stats.agencies.inactive} inactive</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Payslips Card */}
        {stats?.payslips && (
          <Link href="/payslips">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payslips</CardTitle>
                <ClipboardList className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.payslips.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-green-600 font-medium">{stats.payslips.processed} processed</span>
                  <span>•</span>
                  <span>{stats.payslips.pending} pending</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Users Card */}
        {stats?.users && (
          <Link href="/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-green-600 font-medium">{stats.users.active} active</span>
                  <span>•</span>
                  <span>{stats.users.inactive} inactive</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Tasks Card */}
        {stats?.tasks && (
          <Link href="/tasks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.pending}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-orange-600 font-medium">pending</span>
                  <span>•</span>
                  <span className="text-green-600">{stats.tasks.completed} completed</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Leads Card */}
        {stats?.leads && (
          <Link href="/leads">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.total}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="text-blue-600 font-medium">{stats.leads.new} new</span>
                  <span>•</span>
                  <span className="text-green-600">{stats.leads.converted} converted</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Revenue Card - Full Width if invoices permission */}
      {stats?.invoices && stats.invoices.totalRevenue > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Total Revenue (Paid Invoices)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency(stats.invoices.totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              From {stats.invoices.paid} paid invoices
            </p>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout for Activities and Expirations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Contract Expirations */}
        {expiringContracts && expiringContracts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Contracts Expiring Soon
              </CardTitle>
              <CardDescription>
                Contracts ending within the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{contract.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {contract.contractor.name}
                        {" • "}
                        {contract.agency?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {contract.endDate && formatDistanceToNow(new Date(contract.endDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/contracts">View All Contracts</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        {activities && activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest actions in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          activity.action === "CREATE" ? "default" :
                          activity.action === "UPDATE" ? "secondary" :
                          activity.action === "DELETE" ? "destructive" :
                          "outline"
                        }>
                          {activity.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.entityType}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {activity.userName} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/reports/activity-logs">View All Activity</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading State */}
      {statsLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      
      {/* No Access Message */}
      {!statsLoading && !hasDashboardAccess && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Limited Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have limited permissions. Contact your administrator to request access to more features.
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                You currently have {permissions.length} permission{permissions.length !== 1 ? "s" : ""}:
              </p>
              <p className="text-xs text-muted-foreground">
                Your role: <span className="font-medium">{session?.user?.roleName?.replace("_", " ")}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      </div>
    </RouteGuard>
  );
}
