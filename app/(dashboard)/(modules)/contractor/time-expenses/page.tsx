"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Clock, DollarSign, Upload, Calendar, Trash2, Edit, AlertCircle, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";
import { StatsCardSkeleton, TableSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Contractor Time & Expenses Page
 * 
 * Allows contractors to log time and submit expenses with full tRPC integration.
 * Features weekly timesheet grouping and professional expense tracking.
 */

export default function ContractorTimeExpensesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string>("");

  // Time entry form state
  const [timeForm, setTimeForm] = useState({
    contractId: "",
    date: new Date().toISOString().split('T')[0],
    hours: "",
    description: "",
    projectName: "",
    taskName: "",
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    contractId: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    description: "",
    receiptUrl: "",
  });

  // Fetch contractor data to get contracts
  const { data: contractor } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id }
  );

  // Fetch timesheets
  const { data: timesheets, isLoading: timesheetsLoading, error: timesheetsError } = api.timesheet.getMyTimesheets.useQuery();

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading, error: expensesError } = api.expense.getMyExpenses.useQuery();

  // Fetch expense summary
  const { data: expenseSummary } = api.expense.getMyExpenseSummary.useQuery();

  // Mutations
  const createTimeEntry = api.timesheet.createEntry.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time entry added successfully.",
      });
      setIsTimeDialogOpen(false);
      setTimeForm({
        contractId: "",
        date: new Date().toISOString().split('T')[0],
        hours: "",
        description: "",
        projectName: "",
        taskName: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add time entry.",
        variant: "destructive",
      });
    },
  });

  const createExpense = api.expense.createExpense.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense added successfully.",
      });
      setIsExpenseDialogOpen(false);
      setExpenseForm({
        contractId: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        description: "",
        receiptUrl: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense.",
        variant: "destructive",
      });
    },
  });

  const submitTimesheet = api.timesheet.submitTimesheet.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Timesheet submitted for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit timesheet.",
        variant: "destructive",
      });
    },
  });

  const submitExpense = api.expense.submitExpense.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense submitted for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit expense.",
        variant: "destructive",
      });
    },
  });

  const deleteTimeEntry = api.timesheet.deleteEntry.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time entry deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry.",
        variant: "destructive",
      });
    },
  });

  const deleteExpense = api.expense.deleteExpense.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense.",
        variant: "destructive",
      });
    },
  });

  // Calculate time summary
  const calculateTimeSummary = () => {
    if (!timesheets) return { thisWeek: 0, thisMonth: 0, pending: 0 };

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let thisWeek = 0;
    let thisMonth = 0;
    let pending = 0;

    timesheets.forEach((timesheet: any) => {
      timesheet.entries?.forEach((entry: any) => {
        const entryDate = new Date(entry.date);
        const hours = parseFloat(entry.hours || 0);

        if (entryDate >= weekStart) thisWeek += hours;
        if (entryDate >= monthStart) thisMonth += hours;
        if (timesheet.status === 'draft' || timesheet.status === 'submitted') pending += hours;
      });
    });

    return { thisWeek, thisMonth, pending };
  };

  const timeSummary = calculateTimeSummary();

  // Time entries table columns
  const timeColumns: Column<any>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (entry) => new Date(entry.date).toLocaleDateString(),
    },
    {
      key: "hours",
      label: "Hours",
      sortable: true,
      render: (entry) => <span className="font-semibold">{entry.hours}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (entry) => entry.description || "-",
    },
    {
      key: "projectName",
      label: "Project",
      render: (entry) => entry.projectName || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (entry) => <StatusBadge status={entry.timesheet?.status || "draft"} />,
    },
  ];

  // Expense table columns
  const expenseColumns: Column<any>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (expense) => new Date(expense.date).toLocaleDateString(),
    },
    {
      key: "category",
      label: "Category",
      render: (expense) => expense.category || "-",
    },
    {
      key: "description",
      label: "Description",
      render: (expense) => expense.description,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (expense) => <span className="font-semibold">${parseFloat(expense.amount).toFixed(2)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (expense) => <StatusBadge status={expense.status} />,
    },
  ];

  // Flatten time entries for table
  const allTimeEntries = timesheets?.flatMap((ts: any) => 
    ts.entries?.map((entry: any) => ({
      ...entry,
      timesheet: ts,
      timesheetId: ts.id,
    })) || []
  ) || [];

  const handleSubmitTime = () => {
    if (!timeForm.contractId || !timeForm.date || !timeForm.hours || !timeForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTimeEntry.mutate({
      contractId: timeForm.contractId,
      date: new Date(timeForm.date),
      hours: parseFloat(timeForm.hours),
      description: timeForm.description,
      projectName: timeForm.projectName || undefined,
      taskName: timeForm.taskName || undefined,
    });
  };

  const handleSubmitExpense = () => {
    if (!expenseForm.contractId || !expenseForm.date || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createExpense.mutate({
      contractId: expenseForm.contractId,
      date: new Date(expenseForm.date),
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      description: expenseForm.description,
      receiptUrl: expenseForm.receiptUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time & Expenses"
        description="Log your hours and submit expense claims"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {timesheetsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="This Week"
              value={`${timeSummary.thisWeek.toFixed(1)} hrs`}
              icon={Clock}
            />
            <StatsCard
              title="This Month"
              value={`${timeSummary.thisMonth.toFixed(1)} hrs`}
              icon={Clock}
            />
            <StatsCard
              title="Pending Approval"
              value={`${timeSummary.pending.toFixed(1)} hrs`}
              icon={Clock}
            />
            <StatsCard
              title="Expenses"
              value={`$${expenseSummary?.totalAmount?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              description={`${expenseSummary?.pendingCount || 0} pending`}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="time" className="space-y-6">
        <TabsList>
          <TabsTrigger value="time">Time Entries</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* Time Entries Tab */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Time Entries</CardTitle>
                  <CardDescription>
                    Track and submit your working hours
                  </CardDescription>
                </div>
                <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Log Time
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Log Time Entry</DialogTitle>
                      <DialogDescription>
                        Add a new time entry for your work
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contract">Contract *</Label>
                        <Select value={timeForm.contractId} onValueChange={(value) => setTimeForm({ ...timeForm, contractId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contract" />
                          </SelectTrigger>
                          <SelectContent>
                            {contractor?.contracts?.map((contract: any) => (
                              <SelectItem key={contract.id} value={contract.id}>
                                {contract.contractReference || "Contract"} - {contract.agency?.name || "Direct"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="date"
                            type="date"
                            className="pl-9"
                            value={timeForm.date}
                            onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hours">Hours Worked *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="hours"
                            type="number"
                            step="0.5"
                            placeholder="8"
                            className="pl-9"
                            value={timeForm.hours}
                            onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input
                          id="projectName"
                          placeholder="Client Dashboard"
                          value={timeForm.projectName}
                          onChange={(e) => setTimeForm({ ...timeForm, projectName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taskName">Task Name</Label>
                        <Input
                          id="taskName"
                          placeholder="Frontend Development"
                          value={timeForm.taskName}
                          onChange={(e) => setTimeForm({ ...timeForm, taskName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the work you did..."
                          rows={3}
                          value={timeForm.description}
                          onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsTimeDialogOpen(false)}
                          disabled={createTimeEntry.isLoading}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitTime} disabled={createTimeEntry.isLoading}>
                          {createTimeEntry.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Entry"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {timesheetsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{timesheetsError.message}</AlertDescription>
                </Alert>
              )}

              {timesheetsLoading ? (
                <TableSkeleton />
              ) : allTimeEntries.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No time entries yet"
                  description="Start tracking your work hours by adding your first time entry."
                  action={{
                    label: "Log Time",
                    onClick: () => setIsTimeDialogOpen(true),
                  }}
                />
              ) : (
                <DataTable
                  data={allTimeEntries}
                  columns={timeColumns}
                  searchable
                  searchPlaceholder="Search time entries..."
                  actions={(entry) => (
                    <div className="flex gap-2">
                      {entry.timesheet?.status === 'draft' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => deleteTimeEntry.mutate({ entryId: entry.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Claims</CardTitle>
                  <CardDescription>
                    Submit and track your business expenses
                  </CardDescription>
                </div>
                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Submit Expense Claim</DialogTitle>
                      <DialogDescription>
                        Add a new expense for reimbursement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="expenseContract">Contract *</Label>
                        <Select value={expenseForm.contractId} onValueChange={(value) => setExpenseForm({ ...expenseForm, contractId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contract" />
                          </SelectTrigger>
                          <SelectContent>
                            {contractor?.contracts?.map((contract: any) => (
                              <SelectItem key={contract.id} value={contract.id}>
                                {contract.contractReference || "Contract"} - {contract.agency?.name || "Direct"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseDate">Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="expenseDate"
                            type="date"
                            className="pl-9"
                            value={expenseForm.date}
                            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Meals">Meals</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-9"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseDescription">Description *</Label>
                        <Textarea
                          id="expenseDescription"
                          placeholder="Describe the expense..."
                          rows={3}
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="receiptUrl">Receipt URL</Label>
                        <Input
                          id="receiptUrl"
                          type="url"
                          placeholder="https://..."
                          value={expenseForm.receiptUrl}
                          onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload receipt to cloud storage and paste URL here
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsExpenseDialogOpen(false)}
                          disabled={createExpense.isLoading}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitExpense} disabled={createExpense.isLoading}>
                          {createExpense.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Expense"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {expensesError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{expensesError.message}</AlertDescription>
                </Alert>
              )}

              {expensesLoading ? (
                <TableSkeleton />
              ) : !expenses || expenses.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No expenses yet"
                  description="Start tracking your business expenses for reimbursement."
                  action={{
                    label: "Add Expense",
                    onClick: () => setIsExpenseDialogOpen(true),
                  }}
                />
              ) : (
                <DataTable
                  data={expenses}
                  columns={expenseColumns}
                  searchable
                  searchPlaceholder="Search expenses..."
                  actions={(expense) => (
                    <div className="flex gap-2">
                      {(expense.status === 'draft' || expense.status === 'rejected') && (
                        <>
                          {expense.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Submit for Approval"
                              onClick={() => submitExpense.mutate({ expenseId: expense.id })}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => deleteExpense.mutate({ expenseId: expense.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
