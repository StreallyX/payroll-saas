
"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function PayrollPartnerInvoicesPage() {
  const invoices = [
    { id: "INV-PP-001", partner: "PayrollPro Services", amount: "$3,200", date: "2024-11-01", status: "paid", service: "Monthly Processing" },
    { id: "INV-PP-002", partner: "Global Payroll Inc.", amount: "$2,850", date: "2024-11-05", status: "pending", service: "Compliance Review" },
    { id: "INV-PP-003", partner: "QuickPay Solutions", amount: "$4,100", date: "2024-10-28", status: "paid", service: "Tax Filing" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "overdue": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll Partner Invoices" description="Manage payroll service provider billing">
        <div className="flex gap-3">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">$84,560</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payment</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">$8,920</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Month</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">$12,450</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Payroll Partner Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.partner}</TableCell>
                  <TableCell className="font-semibold">{inv.amount}</TableCell>
                  <TableCell className="hidden md:table-cell">{inv.date}</TableCell>
                  <TableCell className="hidden lg:table-cell">{inv.service}</TableCell>
                  <TableCell><Badge className={getStatusColor(inv.status)} variant="secondary">{inv.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
