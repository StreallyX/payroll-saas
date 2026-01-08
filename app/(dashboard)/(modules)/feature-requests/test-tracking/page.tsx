"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { CheckCircle2, Circle, Search, Save, RotateCcw } from "lucide-react";

// Define platform pages organized by role
const PLATFORM_PAGES = {
  SUPER_ADMIN: [
    { url: "/admin/dashboard", name: "Super Admin Dashboard" },
    { url: "/admin/analytics", name: "Analytics" },
    { url: "/admin/users", name: "User Management" },
    { url: "/admin/tenants", name: "Tenant Management" },
    { url: "/admin/impersonations", name: "Impersonation Management" },
    { url: "/admin/settings/subscriptions", name: "Subscription Settings" },
    { url: "/admin/settings/countries", name: "Countries Settings" },
    { url: "/admin/settings/currencies", name: "Currencies Settings" },
    { url: "/admin/settings/features", name: "Feature Flags" },
  ],
  ADMIN: [
    { url: "/dashboard", name: "Admin Dashboard" },
    { url: "/users", name: "User Management" },
    { url: "/contracts", name: "Contract Management" },
    { url: "/contracts/create", name: "Create Contract" },
    { url: "/invoices", name: "Invoice Management" },
    { url: "/timesheets", name: "Timesheet Review" },
    { url: "/expenses", name: "Expense Management" },
    { url: "/payslips", name: "Payslip Management" },
    { url: "/payments", name: "Payment Management" },
    { url: "/remittances", name: "Remittance Management" },
    { url: "/settings", name: "General Settings" },
    { url: "/settings/tenant", name: "Tenant Settings" },
    { url: "/settings/branding", name: "Branding Settings" },
    { url: "/settings/roles", name: "Role Management" },
    { url: "/settings/permissions", name: "Permission Management" },
    { url: "/settings/banks", name: "Bank Management" },
    { url: "/settings/companies", name: "Company Management" },
    { url: "/settings/currencies", name: "Currency Settings" },
    { url: "/settings/countries", name: "Country Settings" },
    { url: "/settings/legal", name: "Legal Documents" },
    { url: "/settings/webhooks", name: "Webhook Configuration" },
    { url: "/tasks", name: "Task Management" },
    { url: "/referrals", name: "Referral Management" },
    { url: "/feature-requests/manage", name: "Feature Request Management" },
    { url: "/feature-requests/test-tracking", name: "Test Tracking" },
  ],
  CONTRACTOR: [
    { url: "/dashboard", name: "Contractor Dashboard" },
    { url: "/profile", name: "Profile Management" },
    { url: "/contracts", name: "My Contracts" },
    { url: "/timesheets", name: "My Timesheets" },
    { url: "/timesheets/create", name: "Create Timesheet" },
    { url: "/expenses", name: "My Expenses" },
    { url: "/expenses/create", name: "Create Expense" },
    { url: "/invoices", name: "My Invoices" },
    { url: "/payslips", name: "My Payslips" },
    { url: "/remittances", name: "My Remittances" },
    { url: "/referrals", name: "My Referrals" },
    { url: "/banks", name: "Bank Account Management" },
    { url: "/feature-requests/new", name: "Submit Feature Request" },
  ],
  AGENCY: [
    { url: "/dashboard", name: "Agency Dashboard" },
    { url: "/users", name: "Contractor Management" },
    { url: "/contracts", name: "Contract Management" },
    { url: "/contracts/create", name: "Create Contract" },
    { url: "/invoices", name: "Invoice Management" },
    { url: "/payments", name: "Payment Management" },
    { url: "/companies", name: "Company Management" },
    { url: "/banks", name: "Bank Management" },
    { url: "/settings/roles", name: "Role Management" },
    { url: "/feature-requests/new", name: "Submit Feature Request" },
  ],
  PAYROLL: [
    { url: "/dashboard", name: "Payroll Dashboard" },
    { url: "/users", name: "User Management" },
    { url: "/contracts", name: "Contract View" },
    { url: "/payslips", name: "Payslip Management" },
    { url: "/payslips/create", name: "Create Payslip" },
    { url: "/invoices", name: "Invoice Management" },
    { url: "/remittances", name: "Remittance Management" },
    { url: "/tasks", name: "Task Management" },
    { url: "/settings/roles", name: "Role Management" },
    { url: "/feature-requests/new", name: "Submit Feature Request" },
  ],
};

export default function TestTrackingPage() {
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageStatuses, setPageStatuses] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch page test statuses
  const { data: testStatuses, isLoading, refetch } = api.pageTestStatus.list.useQuery({
    role: selectedRole,
  });

  // Mutations
  const updateStatusMutation = api.pageTestStatus.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Test status updated successfully!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const bulkUpdateMutation = api.pageTestStatus.bulkUpdate.useMutation({
    onSuccess: () => {
      toast.success("All changes saved successfully!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Load statuses when data changes
  useEffect(() => {
    if (testStatuses) {
      const statusMap: Record<string, boolean> = {};
      testStatuses.forEach((status) => {
        const key = `${status.pageRole}-${status.pageUrl}`;
        statusMap[key] = status.isValidated;
      });
      setPageStatuses(statusMap);
    }
  }, [testStatuses]);

  const handleCheckboxChange = (role: string, pageUrl: string, checked: boolean) => {
    const key = `${role}-${pageUrl}`;
    setPageStatuses((prev) => ({ ...prev, [key]: checked }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    const updates = Object.entries(pageStatuses).map(([key, isValidated]) => {
      const [role, ...urlParts] = key.split("-");
      const pageUrl = urlParts.join("-");
      const page = PLATFORM_PAGES[role as keyof typeof PLATFORM_PAGES]?.find((p) => p.url === pageUrl);
      
      return {
        pageUrl,
        pageName: page?.name || pageUrl,
        pageRole: role,
        isValidated,
      };
    });

    await bulkUpdateMutation.mutateAsync({ updates });
  };

  const handleReset = () => {
    if (testStatuses) {
      const statusMap: Record<string, boolean> = {};
      testStatuses.forEach((status) => {
        const key = `${status.pageRole}-${status.pageUrl}`;
        statusMap[key] = status.isValidated;
      });
      setPageStatuses(statusMap);
      setHasChanges(false);
    }
  };

  // Calculate statistics
  const calculateStats = (role: string) => {
    const pages = PLATFORM_PAGES[role as keyof typeof PLATFORM_PAGES] || [];
    const validated = pages.filter((page) => {
      const key = `${role}-${page.url}`;
      return pageStatuses[key] === true;
    }).length;
    return { total: pages.length, validated, percentage: pages.length > 0 ? Math.round((validated / pages.length) * 100) : 0 };
  };

  const stats = calculateStats(selectedRole);

  // Filter pages by search query
  const filteredPages = (PLATFORM_PAGES[selectedRole as keyof typeof PLATFORM_PAGES] || []).filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingState message="Loading test tracking data..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Test Tracking"
        description="Track testing progress for all platform pages organized by user role"
      >
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={handleSaveAll} disabled={!hasChanges} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </PageHeader>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Progress - {selectedRole}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Pages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.validated}</div>
              <div className="text-sm text-muted-foreground">Validated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.percentage}%</div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Tabs */}
      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="SUPER_ADMIN">Super Admin</TabsTrigger>
          <TabsTrigger value="ADMIN">Admin</TabsTrigger>
          <TabsTrigger value="CONTRACTOR">Contractor</TabsTrigger>
          <TabsTrigger value="AGENCY">Agency</TabsTrigger>
          <TabsTrigger value="PAYROLL">Payroll</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Page List */}
          {Object.keys(PLATFORM_PAGES).map((role) => (
            <TabsContent key={role} value={role}>
              {filteredPages.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No pages found"
                  description="Try adjusting your search query"
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {filteredPages.map((page) => {
                        const key = `${role}-${page.url}`;
                        const isValidated = pageStatuses[key] || false;

                        return (
                          <div
                            key={page.url}
                            className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={isValidated}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(role, page.url, checked as boolean)
                                }
                              />
                              <div>
                                <div className="font-medium">{page.name}</div>
                                <div className="text-sm text-muted-foreground">{page.url}</div>
                              </div>
                            </div>
                            {isValidated ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Validated
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Circle className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
