"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Users, DollarSign, FileText } from "lucide-react";
import { api } from "@/lib/trpc";
import { LoadingPage } from "@/components/ui/loading-spinner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [exportFormat, setExportFormat] = useState("csv");

  const { data: overviewData, isLoading: loadingOverview } =
    api.analytics.getOverviewStats.useQuery();

  const { data: actionTrendsData, isLoading: loadingTrends } =
    api.analytics.getActionTrends.useQuery({ days: parseInt(timeRange) });

  const { data: entityDistData, isLoading: loadingEntity } =
    api.analytics.getEntityDistribution.useQuery();

  const { data: contractAnalytics, isLoading: loadingContracts } =
    api.analytics.getContractAnalytics.useQuery();

  const { data: financialData, isLoading: loadingFinancial } =
    api.analytics.getFinancialAnalytics.useQuery({ months: 12 });

  const exportMutation = api.analytics.exportReport.useMutation();

  const handleExport = async (reportType: "audit" | "financial" | "contracts" | "users") => {
    try {
      const result = await exportMutation.mutateAsync({
        reportType,
        format: exportFormat as "csv" | "json",
      });

      // Create download
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (loadingOverview) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Analytics & Reports"
          description="Comprehensive business insights and data visualization"
        />
        <div className="flex items-center gap-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.users?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {overviewData?.users?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.contracts?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {overviewData?.contracts?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(overviewData?.revenue?.total || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ${Number(overviewData?.revenue?.monthly || 0).toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.invoices?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {overviewData?.invoices?.paid || 0} paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Entity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Activity by Entity Type</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEntity ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={entityDistData}
                        dataKey="count"
                        nameKey="entityType"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {entityDistData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Active Users</p>
                      <p className="text-xs text-gray-600">Last 30 days</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {overviewData?.users?.active || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Active Contracts</p>
                      <p className="text-xs text-gray-600">Currently active</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {overviewData?.contracts?.active || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Monthly Revenue</p>
                      <p className="text-xs text-gray-600">This month</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    ${Number(overviewData?.revenue?.monthly || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Trends Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Trends Over Time</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={actionTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="CREATE" stroke="#10b981" />
                    <Line type="monotone" dataKey="UPDATE" stroke="#3b82f6" />
                    <Line type="monotone" dataKey="DELETE" stroke="#ef4444" />
                    <Line type="monotone" dataKey="VIEW" stroke="#8b5cf6" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingContracts ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contractAnalytics?.statusBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingContracts ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contractAnalytics?.workflowBreakdown}
                        dataKey="count"
                        nameKey="workflowStatus"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {contractAnalytics?.workflowBreakdown?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expiring Contracts */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts Expiring Soon (Next 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {contractAnalytics?.expiringContracts?.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No contracts expiring soon</p>
              ) : (
                <div className="space-y-2">
                  {contractAnalytics?.expiringContracts?.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{contract.title || "Untitled Contract"}</p>
                        <p className="text-sm text-gray-600">
                          {contract.contractor?.name} • {contract.agency?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          {contract.endDate &&
                            new Date(contract.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">End date</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFinancial ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={financialData?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    <Bar dataKey="invoices" fill="#3b82f6" name="Invoices" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={financialData?.statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {financialData?.statusBreakdown?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total Revenue</p>
                    <p className="text-xs text-gray-600">Paid invoices</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    ${Number(financialData?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Pending Revenue</p>
                    <p className="text-xs text-gray-600">Unpaid invoices</p>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    ${Number(financialData?.pendingRevenue || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total Invoices</p>
                    <p className="text-xs text-gray-600">All time</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {financialData?.statusBreakdown?.reduce(
                      (sum: number, item: any) => sum + item.count,
                      0
                    ) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Audit Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download complete audit trail with all user actions and system events.
                </p>
                <Button
                  onClick={() => handleExport("audit")}
                  disabled={exportMutation.isLoading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Financial Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download financial data including invoices, payments, and revenue.
                </p>
                <Button
                  onClick={() => handleExport("financial")}
                  disabled={exportMutation.isLoading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Financial Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Contracts Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download all contract data with contractor and agency information.
                </p>
                <Button
                  onClick={() => handleExport("contracts")}
                  disabled={exportMutation.isLoading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Contracts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Users Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download user directory with roles and permissions.
                </p>
                <Button
                  onClick={() => handleExport("users")}
                  disabled={exportMutation.isLoading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Users
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
