
"use client"

import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { DollarSign, FileText, Users, Clock, Calculator, TrendingUp } from "lucide-react"

export default function PayrollDashboard() {
  const { data: session } = useSession() || {}

  const stats = [
    {
      title: "Total Payroll This Month",
      value: "$156,750",
      description: "Processed payments",
      icon: DollarSign,
      trend: { value: 18, label: "vs last month", isPositive: true }
    },
    {
      title: "Active Contracts",
      value: "45",
      description: "Being processed",
      icon: FileText,
      trend: { value: 8, label: "vs last month", isPositive: true }
    },
    {
      title: "Employees Paid",
      value: "234",
      description: "This month",
      icon: Users,
      trend: { value: 12, label: "vs last month", isPositive: true }
    },
    {
      title: "Pending Payslips",
      value: "12",
      description: "To be generated",
      icon: Calculator,
    },
    {
      title: "Average Processing Time",
      value: "2.4 days",
      description: "From receipt to payment",
      icon: Clock,
      trend: { value: -15, label: "vs last month", isPositive: true }
    },
    {
      title: "Monthly Growth",
      value: "24%",
      description: "Revenue increase",
      icon: TrendingUp,
      trend: { value: 6, label: "vs last month", isPositive: true }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Dashboard"
        description="Monitor payroll operations and processing"
      />

      {/* Welcome Message */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-emerald-900">
              Welcome back, {session?.user?.name}!
            </h3>
            <p className="text-emerald-700">
              Manage payroll operations and employee payments.
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

      {/* Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Acme Corp - Weekly Payroll</p>
                <p className="text-sm text-gray-600">45 employees • Processed</p>
              </div>
              <span className="text-sm text-green-600 font-medium">$32,450</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Tech Solutions - Contractors</p>
                <p className="text-sm text-gray-600">12 contractors • Processing</p>
              </div>
              <span className="text-sm text-orange-600 font-medium">$18,200</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Marketing Agency - Monthly</p>
                <p className="text-sm text-gray-600">28 employees • Pending</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">$24,800</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Queue</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Payroll Batch #PB-2024-015</p>
                <p className="text-sm text-yellow-700">Awaiting approval</p>
              </div>
              <span className="text-sm text-yellow-600 font-medium">78 employees</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Tax Calculations #TX-2024-008</p>
                <p className="text-sm text-blue-700">In progress</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">156 records</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Direct Deposit #DD-2024-092</p>
                <p className="text-sm text-green-700">Completed</p>
              </div>
              <span className="text-sm text-green-600 font-medium">234 payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
