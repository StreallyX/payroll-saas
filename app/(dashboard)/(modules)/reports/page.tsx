"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { StatsCard } from "@/components/shared/stats-card";
import { api } from "@/lib/trpc";
import { useRouter } from "next/navigation";

// RBAC
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions";

// Icons
import {
  BarChart3,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";

const CAN_VIEW_ANALYTICS = buildPermissionKey(
  Resource.REPORT,
  Action.READ,
  PermissionScope.GLOBAL
);

export default function ReportPage() {
  const router = useRouter();

  // ===========================
  // LOAD DASHBOARD SUMMARY
  // ===========================
  const { data: summary, isLoading } = api.report.getDashboardSummary.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports & Analytics"
          description="Access comprehensive business reports and insights"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `$${(summary?.totalRevenue || 0).toLocaleString()}`,
      description: "This year",
      icon: DollarSign,
      iconColor: "text-green-600",
    },
    {
      title: "Active Contractors",
      value: summary?.activeContractors || 0,
      description: "Currently active",
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      title: "Active Workers",
      value: summary?.activeWorkers || 0,
      description: "On local employment",
      icon: Users,
      iconColor: "text-purple-600",
    },
    {
      title: "Gross Margin",
      value: `${(summary?.marginPercentage || 0).toFixed(1)}%`,
      description: `$${(summary?.grossMargin || 0).toLocaleString()}`,
      icon: TrendingUp,
      iconColor: "text-orange-600",
    },
  ];

  const reports = [
    {
      title: "Margin Report",
      description: "View gross margin and profitability over time. Track revenue, costs, and profit margins.",
      icon: TrendingUp,
      href: "/reports/margin",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Live Contractors",
      description: "Active contractors overview with status distribution and geographic breakdown.",
      icon: Users,
      href: "/reports/contractors",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Contracts by Country",
      description: "Geographic distribution of contracts across all countries and regions.",
      icon: MapPin,
      href: "/reports/contracts-by-country",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Income by Country",
      description: "Revenue breakdown by geographic location with detailed analytics.",
      icon: DollarSign,
      href: "/reports/income-by-country",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const activityReports = [
    {
      title: "Activity Logs",
      description: "View system activity and audit logs",
      href: "/reports/activity-logs",
    },
    {
      title: "User Activity",
      description: "Track user actions and engagement",
      href: "/reports/user-activity",
    },
    {
      title: "Email Logs",
      description: "Monitor email communications",
      href: "/reports/email-logs",
    },
    {
      title: "SMS Logs",
      description: "Track SMS notifications",
      href: "/reports/sms-logs",
    },
  ];

  return (
    <RouteGuard permissions={[CAN_VIEW_ANALYTICS]} requireAll={false}>
      <div className="space-y-6">
        <PageHeader
          title="Reports & Analytics"
          description="Access comprehensive business reports and insights"
        />

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              iconColor={stat.iconColor}
            />
          ))}
        </div>

        {/* Main Reports */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Business Reports</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(report.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <report.icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity Reports */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Activity & Logs</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {activityReports.map((report, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(report.href)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
