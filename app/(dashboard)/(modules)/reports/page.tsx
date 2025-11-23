"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { api } from "@/lib/trpc";

// RBAC
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions";

// Charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const CAN_VIEW_ANALYTICS = buildPermissionKey(
  Resource.REPORT,
  Action.READ,
  PermissionScope.GLOBAL
);

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "financial" | "operations" | "hr"
  >("overview");

  // ===========================
  // LOAD ANALYTICS
  // ===========================
  const { data: overview, isLoading: loadingOverview } =
    api.analytics.getOverviewStats.useQuery();

  const { data: financial, isLoading: loadingFinancial } =
    api.analytics.getFinancialAnalytics.useQuery(
      { months: 12 },
      { enabled: activeTab === "financial" }
    );

  // ===========================
  // OVERVIEW CHART DATA
  // ===========================
  const overviewChartData = overview
    ? [
        { name: "Users", value: overview.users.total },
        { name: "Active Users", value: overview.users.active },
        { name: "Contracts", value: overview.contracts.total },
        { name: "Invoices", value: overview.invoices.total },
        { name: "Revenue", value: overview.revenue.total },
      ]
    : [];

  // ===========================
  // FINANCIAL CHART DATA
  // ===========================
  // Ton router renvoie :
  // {
  //   monthly: [ { month, revenue, invoices, paid, pending } ],
  //   statusBreakdown: [...],
  //   totalRevenue: number
  // }

  const monthlyFinancialData =
    financial?.monthly?.map((m) => ({
      month: m.month,
      revenue: m.revenue,
      invoices: m.invoices,
    })) ?? [];

  return (
    <RouteGuard permissions={[CAN_VIEW_ANALYTICS]} requireAll={false}>
      <div className="space-y-6">
        <PageHeader
          title="Reports & Analytics"
          description="Visualize business performance through charts and analytics"
        />

        {/* ====================== */}
        {/*        TABS            */}
        {/* ====================== */}
        <div className="grid max-w-2xl grid-cols-4 gap-2 p-1 bg-muted rounded-lg">
          {(["overview", "financial", "operations", "hr"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ============================= */}
        {/*          OVERVIEW TAB         */}
        {/* ============================= */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>Overview Analytics</CardTitle>
            </CardHeader>

            <CardContent className="h-[400px]">
              {loadingOverview ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading overview charts...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ============================= */}
        {/*        FINANCIAL TAB          */}
        {/* ============================= */}
        {activeTab === "financial" && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* LINE CHART */}
              <div className="h-[400px]">
                {loadingFinancial ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading financial charts...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyFinancialData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* RAW DATA */}
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
{JSON.stringify(financial, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* ============================= */}
        {/*        OPERATIONS TAB         */}
        {/* ============================= */}
        {activeTab === "operations" && (
          <Card>
            <CardHeader>
              <CardTitle>Operations Reports</CardTitle>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
              Contract & Ops analytics coming soon
            </CardContent>
          </Card>
        )}

        {/* ============================= */}
        {/*            HR TAB             */}
        {/* ============================= */}
        {activeTab === "hr" && (
          <Card>
            <CardHeader>
              <CardTitle>HR Insights</CardTitle>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
              HR analytics coming soon
            </CardContent>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
