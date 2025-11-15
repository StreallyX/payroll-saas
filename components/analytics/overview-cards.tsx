
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = "text-blue-600",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OverviewCardsProps {
  stats: {
    users?: { total: number; active: number };
    contractors?: { total: number; active: number };
    contracts?: { total: number; active: number };
    invoices?: { total: number; paid: number };
    agencies?: { total: number };
    revenue?: { total: number; monthly: number };
  };
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stats.users && (
        <StatCard
          title="Total Users"
          value={stats.users.total}
          description={`${stats.users.active} active`}
          icon={require("lucide-react").Users}
          iconColor="text-blue-600"
        />
      )}

      {stats.contractors && (
        <StatCard
          title="Contractors"
          value={stats.contractors.total}
          description={`${stats.contractors.active} active`}
          icon={require("lucide-react").UserCheck}
          iconColor="text-green-600"
        />
      )}

      {stats.contracts && (
        <StatCard
          title="Contracts"
          value={stats.contracts.total}
          description={`${stats.contracts.active} active`}
          icon={require("lucide-react").FileText}
          iconColor="text-purple-600"
        />
      )}

      {stats.invoices && (
        <StatCard
          title="Invoices"
          value={stats.invoices.total}
          description={`${stats.invoices.paid} paid`}
          icon={require("lucide-react").Receipt}
          iconColor="text-orange-600"
        />
      )}

      {stats.agencies && (
        <StatCard
          title="Agencies"
          value={stats.agencies.total}
          description="Partner agencies"
          icon={require("lucide-react").Building2}
          iconColor="text-indigo-600"
        />
      )}

      {stats.revenue && (
        <StatCard
          title="Total Revenue"
          value={`$${Number(stats.revenue.total).toLocaleString()}`}
          description={`$${Number(stats.revenue.monthly).toLocaleString()} this month`}
          icon={require("lucide-react").DollarSign}
          iconColor="text-green-600"
        />
      )}
    </div>
  );
}
