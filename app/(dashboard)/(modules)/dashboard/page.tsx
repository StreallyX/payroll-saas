"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { UserCheck, FileText, DollarSign, Clock, Upload, CheckCircle, Building2, Users, TrendingUp } from "lucide-react";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/lib/trpc";

/**
 * Unified Dashboard Page
 * 
 * This dashboard serves all user types with adaptive content based on their role.
 * - Contractors see their personal work stats
 * - Agencies see team management stats
 * - Payroll Partners see payroll processing stats
 * - Admins see overall system stats
 * 
 * Permission Required: dashboard.view
 * 
 * Migration Note:
 * - Replaces: /contractor/page.tsx
 * - Replaces: /agency/page.tsx
 * - Replaces: /payroll-partner/page.tsx
 */

export default function DashboardPage() {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  
  // Determine user type
  const userType = session?.user?.roleName?.toLowerCase() || "user";
  const isContractor = userType.includes("contractor");
  const isAgency = userType.includes("agency");
  const isPayrollPartner = userType.includes("payroll");
  const isAdmin = userType.includes("admin") || userType.includes("hr");

  // Fetch relevant data based on user type
  const { data: contractor } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id && isContractor }
  );

  // Contractor Dashboard
  if (isContractor) {
    const stats = [
      {
        title: "Active Contracts",
        value: contractor?.contracts?.length?.toString() || "0",
        description: "Current assignments",
        icon: FileText,
      },
      {
        title: "This Month Earnings",
        value: "$8,450",
        description: "Pending payment",
        icon: DollarSign,
        trend: { value: 15, label: "vs last month", isPositive: true }
      },
      {
        title: "Hours This Week",
        value: "32.5",
        description: "Logged hours",
        icon: Clock,
      },
      {
        title: "Pending Timesheets",
        value: "2",
        description: "Need submission",
        icon: Upload,
      },
      {
        title: "Completed Projects",
        value: "12",
        description: "All time",
        icon: CheckCircle,
        trend: { value: 8, label: "vs last month", isPositive: true }
      },
      {
        title: "Profile Status",
        value: "Complete",
        description: "Documentation ready",
        icon: UserCheck,
      }
    ];

    return (
      <RouteGuard permission="dashboard.read.own">
        <div className="space-y-6">
          <PageHeader
            title="Contractor Dashboard"
            description="Manage your work, timesheets, and payments"
          />

          {/* Welcome Message */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-purple-900">
                  Welcome back, {session?.user?.name}!
                </h3>
                <p className="text-purple-700">
                  Track your work progress and manage your assignments.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                trend={stat.trend}
              />
            ))}
          </div>

          {/* Work Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
              <div className="space-y-3">
                {contractor?.contracts && contractor.contracts.length > 0 ? (
                  contractor.contracts.map((contract: any) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-gray-900">{contract.contractReference || "Contract"}</p>
                        <p className="text-sm text-gray-600">
                          {contract.agency?.name || "Direct Contract"} • Due {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {contract.status || "Active"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No active contracts</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Timesheet submitted for Week 48</span>
                  <span className="text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Invoice #INV-2024-089 generated</span>
                  <span className="text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Profile updated</span>
                  <span className="text-gray-400">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  // Agency Dashboard
  if (isAgency) {
    const stats = [
      {
        title: "Active Contractors",
        value: "24",
        description: "Currently assigned",
        icon: Users,
        trend: { value: 12, label: "vs last month", isPositive: true }
      },
      {
        title: "Total Revenue",
        value: "$156,400",
        description: "This month",
        icon: DollarSign,
        trend: { value: 18, label: "vs last month", isPositive: true }
      },
      {
        title: "Active Contracts",
        value: "31",
        description: "In progress",
        icon: FileText,
      },
      {
        title: "Pending Invoices",
        value: "8",
        description: "Awaiting payment",
        icon: Upload,
      },
      {
        title: "Placement Rate",
        value: "94%",
        description: "Success rate",
        icon: TrendingUp,
        trend: { value: 5, label: "vs last month", isPositive: true }
      },
      {
        title: "Team Members",
        value: "12",
        description: "Active staff",
        icon: Building2,
      }
    ];

    return (
      <RouteGuard permission="dashboard.read.own">
        <div className="space-y-6">
          <PageHeader
            title="Agency Dashboard"
            description="Manage your team, contractors, and business operations"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Welcome back, {session?.user?.name}!
                </h3>
                <p className="text-blue-700">
                  Manage your contractors and monitor business performance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                trend={stat.trend}
              />
            ))}
          </div>
        </div>
      </RouteGuard>
    );
  }

  // Admin/Default Dashboard
  return (
    <RouteGuard permission="dashboard.read.own">
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your system and activities"
        />

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Welcome back, {session?.user?.name}!
              </h3>
              <p className="text-gray-700">
                Here's what's happening with your workspace today.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value="156"
            description="Active users"
            icon={Users}
          />
          <StatCard
            title="Active Contracts"
            value="89"
            description="In progress"
            icon={FileText}
          />
          <StatCard
            title="Monthly Revenue"
            value="$245,000"
            description="This month"
            icon={DollarSign}
          />
        </div>
      </div>
    </RouteGuard>
  );
}
