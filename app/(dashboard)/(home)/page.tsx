"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { getFirstAccessibleRoute } from "@/lib/routing/dynamic-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, FileText, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { permissions, isSuperAdmin, hasPermission } = usePermissions();

  useEffect(() => {
    // Rediriger vers la première page accessible si ce n'est pas le dashboard
    if (status === "authenticated" && permissions.length > 0) {
      const firstRoute = getFirstAccessibleRoute(permissions);
      // Si la première route n'est pas dashboard, rediriger automatiquement
      if (firstRoute !== "/dashboard" && firstRoute !== "/" && permissions.length > 0) {
        // Only redirect if user has specific permissions
        // This allows users with many permissions to see the dashboard
        const hasSpecificModule = permissions.some(p => 
          !p.includes('view') || p.split('.').length > 2
        );
        if (!hasSpecificModule) {
          router.push(firstRoute);
        }
      }
    }
  }, [status, permissions, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Quick stats cards for the dashboard
  const quickLinks = [
    {
      title: "Users",
      description: "Manage team members",
      icon: Users,
      href: "/users",
      permission: "tenant.users.view",
      color: "text-blue-600",
    },
    {
      title: "Contracts",
      description: "View and manage contracts",
      icon: FileText,
      href: "/contracts",
      permission: "contracts.view",
      color: "text-green-600",
    },
    {
      title: "Invoices",
      description: "Track invoicing",
      icon: DollarSign,
      href: "/invoices",
      permission: "invoices.view",
      color: "text-purple-600",
    },
    {
      title: "Reports",
      description: "View analytics",
      icon: BarChart3,
      href: "/reports",
      permission: "audit_logs.view",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Role Info Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Your Role</h3>
            <p className="text-2xl font-bold mt-1">
              {session?.user?.roleName?.replace("_", " ").toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {permissions.length} permission{permissions.length !== 1 ? "s" : ""} assigned
            </p>
          </div>
          {isSuperAdmin && (
            <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
              Super Admin
            </div>
          )}
        </div>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const hasAccess = isSuperAdmin || hasPermission(link.permission);
            
            if (!hasAccess) return null;

            return (
              <Link key={link.href} href={link.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <Icon className={`h-8 w-8 ${link.color} mb-3`} />
                  <h3 className="font-semibold text-lg mb-2">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {link.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium">
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Help Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              Contact support or check out our documentation
            </p>
          </div>
          <Button variant="outline">
            Get Help
          </Button>
        </div>
      </Card>
    </div>
  );
}
