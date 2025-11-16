"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, DollarSign, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    amount: 0,
    currency: "USD",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  })

  const utils = api.useUtils()
  const { data: expenses, isLoading } = api.expense.getAll.useQuery()
  const { data: stats } = api.expense.getStatistics.useQuery()

  const createMutation = api.expense.create.useMutation({
    onSuccess: () => {
      toast.success("Expense created successfully!")
      utils.expense.getAll.invalidate()
      utils.expense.getStatistics.invalidate()
      setIsModalOpen(false)
      resetForm()
    },
  })

  const approveMutation = api.expense.approve.useMutation({
    onSuccess: () => {
      toast.success("Expense approved successfully!")
      utils.expense.getAll.invalidate()
      utils.expense.getStatistics.invalidate()
    },
  })

  const rejectMutation = api.expense.reject.useMutation({
    onSuccess: () => {
      toast.success("Expense rejected successfully!")
      utils.expense.getAll.invalidate()
      utils.expense.getStatistics.invalidate()
    },
  })

  const resetForm = () => {
    setFormData({
      amount: 0,
      currency: "USD",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
    })
    setSelectedExpense(null)
  }

  const handleSubmit = () => {
    createMutation.mutate({
      title: formData.category,  
      amount: formData.amount,
      category: formData.category,
      currency: formData.currency,
      description: formData.description,
      expenseDate: new Date(formData.date),
    })
  }


  if (isLoading) return <LoadingState message="Loading expenses..." />

  const expensesList = expenses?.expenses ?? []
  const filteredExpenses = expensesList.filter((e: any) => {
    const matchesSearch = 
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.contractor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Manage and approve contractor expenses">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="REIMBURSED">Reimbursed</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" /> New Expense
          </Button>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${stats.totalAmount?.toFixed(2) || '0.00'}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.submittedExpenses || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.approvedExpenses || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.paidExpenses || 0}</div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <EmptyState 
              title="No expenses found"
              description="Create your first expense"
              icon={DollarSign}
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.contractor?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{expense.contractor?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{expense.category}</Badge></TableCell>
                    <TableCell className="max-w-md truncate">{expense.description}</TableCell>
                    <TableCell className="font-semibold">${expense.amount.toFixed(2)} {expense.currency}</TableCell>
                    <TableCell className="text-sm text-gray-600">{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        expense.status === 'APPROVED' ? 'default' :
                        expense.status === 'REJECTED' ? 'destructive' :
                        expense.status === 'REIMBURSED' ? 'default' : 'secondary'
                      } className={expense.status === 'REIMBURSED' ? 'bg-blue-500' : ''}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedExpense(expense)}><Eye className="h-3 w-3" /></Button>
                        {expense.receiptUrl && <Button size="sm" variant="ghost"><Download className="h-3 w-3" /></Button>}
                        {expense.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate({ id: expense.id })}><CheckCircle className="h-3 w-3 text-green-500" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate({ id: expense.id, reason: "Rejected by admin" })}><XCircle className="h-3 w-3 text-red-500" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Expense</DialogTitle>
            <DialogDescription>Submit a new expense for approval and reimbursement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Describe the expense..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.amount || !formData.category || !formData.description}>Create Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Expense Details */}
      {selectedExpense && (
        <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Contractor</Label><p className="text-sm">{selectedExpense.contractor?.name}</p></div>
              <div><Label>Category</Label><p className="text-sm capitalize">{selectedExpense.category}</p></div>
              <div><Label>Amount</Label><p className="text-sm font-semibold">${selectedExpense.amount.toFixed(2)} {selectedExpense.currency}</p></div>
              <div><Label>Date</Label><p className="text-sm">{format(new Date(selectedExpense.date), 'MMMM dd, yyyy')}</p></div>
              <div><Label>Description</Label><p className="text-sm">{selectedExpense.description}</p></div>
              <div><Label>Status</Label><Badge>{selectedExpense.status}</Badge></div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedExpense(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
