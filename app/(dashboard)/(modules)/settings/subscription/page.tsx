"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Crown, 
  Users, 
  FileText, 
  HardDrive, 
  TrendingUp,
  Check,
  X,
  Zap
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out the platform",
    features: [
      "Up to 10 users",
      "Up to 50 contracts",
      "1GB storage",
      "Basic support",
      "Email notifications"
    ],
    limits: {
      users: 10,
      contracts: 50,
      invoices: 100,
      storage: 1024 * 1024 * 1024, // 1GB
    }
  },
  starter: {
    name: "Starter",
    price: "$49",
    period: "per month",
    description: "For small businesses getting started",
    features: [
      "Up to 50 users",
      "Up to 200 contracts",
      "10GB storage",
      "Priority support",
      "Email & SMS notifications",
      "Basic analytics",
      "Custom branding"
    ],
    limits: {
      users: 50,
      contracts: 200,
      invoices: 500,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    }
  },
  professional: {
    name: "Professional",
    price: "$149",
    period: "per month",
    description: "For growing businesses with more needs",
    features: [
      "Up to 200 users",
      "Unlimited contracts",
      "50GB storage",
      "24/7 premium support",
      "Advanced analytics",
      "Custom domain",
      "API access",
      "White-label options",
      "Custom integrations"
    ],
    limits: {
      users: 200,
      contracts: -1, // Unlimited
      invoices: -1,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    }
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited users",
      "Unlimited contracts",
      "Unlimited storage",
      "Dedicated support team",
      "Advanced security features",
      "Custom SLAs",
      "On-premise deployment option",
      "Custom development",
      "Training & onboarding"
    ],
    limits: {
      users: -1,
      contracts: -1,
      invoices: -1,
      storage: -1,
    }
  }
}

export default function SubscriptionPage() {
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  
  const { data: subscriptionInfo, isLoading, refetch } = api.tenant.getSubscriptionInfo.useQuery()
  const { data: usageData } = api.tenant.getUsageMetrics.useQuery()
  
  const updatePlanMutation = api.tenant.updateSubscriptionPlan.useMutation({
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "Your subscription plan has been updated successfully.",
      })
      refetch()
      setSelectedPlan(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan.",
        variant: "destructive",
      })
    },
  })

  const handleUpgrade = (planKey: string) => {
    updatePlanMutation.mutate({
      plan: planKey as any,
      billingCycle: "monthly",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentPlan = subscriptionInfo?.subscriptionPlan || "free"
  const currentPlanInfo = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0 // Unlimited
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Usage"
        description="Manage your subscription plan and monitor resource usage"
      />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Current Plan: {currentPlanInfo.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {currentPlanInfo.description}
              </CardDescription>
            </div>
            <Badge 
              variant={subscriptionInfo?.subscriptionStatus === "active" ? "default" : "destructive"}
              className="text-sm"
            >
              {subscriptionInfo?.subscriptionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {currentPlanInfo.price}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {currentPlanInfo.period}
            </span>
          </div>
          {subscriptionInfo?.subscriptionEndDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Renews on {new Date(subscriptionInfo.subscriptionEndDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      {usageData && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>
              Current usage of your subscription resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Users */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Users</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageData.currentUsage.users, usageData.quotas?.maxUsers || 10))}`}>
                  {usageData.currentUsage.users} / {usageData.quotas?.maxUsers === -1 ? "Unlimited" : usageData.quotas?.maxUsers}
                </span>
              </div>
              {usageData.quotas?.maxUsers !== -1 && (
                <Progress 
                  value={getUsagePercentage(usageData.currentUsage.users, usageData.quotas?.maxUsers || 10)} 
                  className="h-2"
                />
              )}
            </div>

            {/* Contracts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contracts</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageData.currentUsage.contracts, usageData.quotas?.maxContracts || 50))}`}>
                  {usageData.currentUsage.contracts} / {usageData.quotas?.maxContracts === -1 ? "Unlimited" : usageData.quotas?.maxContracts}
                </span>
              </div>
              {usageData.quotas?.maxContracts !== -1 && (
                <Progress 
                  value={getUsagePercentage(usageData.currentUsage.contracts, usageData.quotas?.maxContracts || 50)} 
                  className="h-2"
                />
              )}
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Storage</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(Number(usageData.currentUsage.storage), Number(usageData.quotas?.maxStorage || 1073741824)))}`}>
                  {formatBytes(Number(usageData.currentUsage.storage))} / {usageData.quotas?.maxStorage === BigInt(-1) ? "Unlimited" : formatBytes(Number(usageData.quotas?.maxStorage))}
                </span>
              </div>
              {usageData.quotas?.maxStorage !== BigInt(-1) && (
                <Progress 
                  value={getUsagePercentage(Number(usageData.currentUsage.storage), Number(usageData.quotas?.maxStorage || 1073741824))} 
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const isCurrent = key === currentPlan
            const isDowngrade = ["professional", "enterprise"].includes(currentPlan) && ["free", "starter"].includes(key)
            
            return (
              <Card key={key} className={isCurrent ? "border-primary border-2" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrent && (
                    <Button
                      onClick={() => handleUpgrade(key)}
                      disabled={updatePlanMutation.isPending || isDowngrade}
                      className="w-full"
                      variant={isDowngrade ? "outline" : "default"}
                    >
                      {updatePlanMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : isDowngrade ? (
                        "Contact Support to Downgrade"
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Upgrade Alert */}
      {usageData && (
        <>
          {getUsagePercentage(usageData.currentUsage.users, usageData.quotas?.maxUsers || 10) >= 80 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                You're approaching your user limit. Consider upgrading your plan to add more users.
              </AlertDescription>
            </Alert>
          )}
          {getUsagePercentage(Number(usageData.currentUsage.storage), Number(usageData.quotas?.maxStorage || 1073741824)) >= 80 && (
            <Alert>
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                You're running low on storage space. Upgrade your plan for more storage capacity.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
