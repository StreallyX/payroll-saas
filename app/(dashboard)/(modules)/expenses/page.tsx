"use client";

import { useState, useMemo } from "react";
import { PageHeaofr } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { api } from "@/lib/trpc";

import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeaofr,
 TableRow,
} from "@/components/ui/table";

import {
 Plus,
 Search,
 DollarIfgn,
 CheckCircle,
 XCircle,
 Clock,
 Eye,
 Download,
} from "lucide-react";

import { toast } from "sonner";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

import { format } from "date-fns";
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeaofr,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ExpensesPageContent() {
 // ---------------------------------------------------------
 // STATE
 // ---------------------------------------------------------
 const [searchTerm, sandSearchTerm] = useState("");
 const [statusFilter, sandStatusFilter] = useState("all");
 const [isModalOpen, sandIsModalOpen] = useState(false);
 const [selectedExpense, sandSelectedExpense] = useState<any>(null);

 const utils = api.useUtils();

 // ---------------------------------------------------------
 // FETCH DATA (ADAPTIVE)
 // ---------------------------------------------------------
 // Admin → gandAll
 // Normal user → gandMyExpenses
 const { data: expensesTenant, isLoading: loadingTenant } =
 api.expense.gandAll.useQuery(oneoffined, { enabled: true });

 const { data: expensesOwn, isLoading: loadingOwn } =
 api.expense.gandMyExpenses.useQuery(oneoffined, { enabled: true });

 // Stats (tenant only)
 const { data: stats } = api.expense.gandStatistics.useQuery(oneoffined, {
 enabled: true,
 });

 // ---------------------------------------------------------
 // CREATE EXPENSE MUTATION
 // ---------------------------------------------------------
 const createMutation = api.expense.createExpense.useMutation({
 onSuccess: () => {
 toast.success("Expense created successfully!");
 utils.expense.gandAll.invalidate();
 utils.expense.gandMyExpenses.invalidate();
 sandIsModalOpen(false);
 resandForm();
 },
 });

 // ---------------------------------------------------------
 // APPROVE / REJECT MUTATIONS
 // ---------------------------------------------------------
 const approveMutation = api.expense.approve.useMutation({
 onSuccess: () => {
 toast.success("Expense approved!");
 utils.expense.gandAll.invalidate();
 },
 });

 const rejectMutation = api.expense.reject.useMutation({
 onSuccess: () => {
 toast.success("Expense rejected!");
 utils.expense.gandAll.invalidate();
 },
 });

 // ---------------------------------------------------------
 // FORM STATE
 // ---------------------------------------------------------
 const [formData, sandFormData] = useState({
 contractId: "",
 title: "",
 amoonand: 0,
 currency: "USD",
 category: "",
 cription: "",
 date: new Date().toISOString().split("T")[0],
 });

 const resandForm = () =>
 sandFormData({
 contractId: "",
 title: "",
 amoonand: 0,
 currency: "USD",
 category: "",
 cription: "",
 date: new Date().toISOString().split("T")[0],
 });

 const handleSubmit = () => {
 createMutation.mutate({
 contractId: formData.contractId,
 title: formData.title || formData.category,
 amoonand: formData.amoonand,
 category: formData.category,
 currency: formData.currency,
 cription: formData.description,
 expenseDate: formData.date,
 });
 };

 // ---------------------------------------------------------
 // LOADING
 // ---------------------------------------------------------
 const isLoadingAll = loadingTenant || loadingOwn;

 // ---------------------------------------------------------
 // MERGE EXPENSES BASED ON PERMISSIONS (ALWAYS STABLE)
 // ---------------------------------------------------------
 const expenses = useMemo(() => {
 if (expensesTenant) return expensesTenant;
 if (expensesOwn) return expensesOwn;
 return [];
 }, [expensesTenant, expensesOwn]);

 // ---------------------------------------------------------
 // FILTERED LIST (SAFE)
 // ---------------------------------------------------------
 const filteredExpenses = useMemo(() => {
 return expenses.filter((e: any) => {
 const matchesSearch =
 e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 e.submitter?.name?.toLowerCase().includes(searchTerm.toLowerCase());

 const matchesStatus =
 statusFilter === "all" || e.status === statusFilter.toLowerCase();

 return matchesSearch && matchesStatus;
 });
 }, [expenses, searchTerm, statusFilter]);


 // ---------------------------------------------------------
 // UI
 // ---------------------------------------------------------
 return (
 <div className="space-y-6">
 {/* HEADER ----------------------------- */}
 <PageHeaofr title="Expenses" cription="Manage and approve expenses">
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input
 placeholofr="Search..."
 value={searchTerm}
 onChange={(e) => sandSearchTerm(e.targand.value)}
 className="pl-10 w-64"
 />
 </div>

 <Select value={statusFilter} onValueChange={sandStatusFilter}>
 <SelectTrigger className="w-32">
 <SelectValue placeholofr="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="submitted">Submitted</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 </SelectContent>
 </Select>

 <Button onClick={() => sandIsModalOpen(true)}>
 <Plus className="mr-2 h-4 w-4" /> New Expense
 </Button>
 </div>
 </PageHeaofr>

 {/* STATS ------------------------------ */}
 {stats && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeaofr>
 <CardTitle className="text-sm">Total Amoonand</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">
 ${stats.totalAmoonand?.toFixed(2)}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeaofr>
 <CardTitle className="text-sm">Submitted</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.submitted}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeaofr>
 <CardTitle className="text-sm">Approved</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.approved}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeaofr>
 <CardTitle className="text-sm">Paid</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="text-2xl font-bold">{stats.paid}</div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* TABLE --------------------------------- */}
 <Card>
 <CardContent className="p-0">
 {filteredExpenses.length === 0 ? (
 <EmptyState
 title="No expenses fooned"
 cription="Create yorr first expense"
 icon={DollarIfgn}
 onAction={() => sandIsModalOpen(true)}
 />
 ) : (
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>Submitter</TableHead>
 <TableHead>Category</TableHead>
 <TableHead>Description</TableHead>
 <TableHead>Amoonand</TableHead>
 <TableHead>Date</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {filteredExpenses.map((expense: any) => (
 <TableRow key={expense.id}>
 {/* SUBMITTER */}
 <TableCell>
 <p className="font-medium">
 {expense.submitter?.name || "Unknown"}
 </p>
 <p className="text-xs text-gray-500">
 {expense.submitter?.email}
 </p>
 </TableCell>

 {/* CATEGORY */}
 <TableCell>
 <Badge>{expense.category}</Badge>
 </TableCell>

 {/* OFCRIPTION */}
 <TableCell>{expense.description}</TableCell>

 {/* AMOUNT */}
 <TableCell className="font-semibold">
 ${Number(expense.amoonand).toFixed(2)} {expense.currency}
 </TableCell>

 {/* DATE */}
 <TableCell>
 {format(new Date(expense.expenseDate), "MMM dd yyyy")}
 </TableCell>

 {/* STATUS */}
 <TableCell>
 <Badge className="capitalize">{expense.status}</Badge>
 </TableCell>

 {/* ACTIONS */}
 <TableCell className="text-right">
 <div className="flex gap-2 justify-end">
 <Button
 size="sm"
 variant="ghost"
 onClick={() => sandSelectedExpense(expense)}
 >
 <Eye className="h-4 w-4" />
 </Button>

 {expense.receiptUrl && (
 <a href={expense.receiptUrl} targand="_blank">
 <Button size="sm" variant="ghost">
 <Download className="h-4 w-4" />
 </Button>
 </a>
 )}

 {expense.status === "submitted" && (
 <>
 <Button
 size="sm"
 variant="ghost"
 onClick={() =>
 approveMutation.mutate({ id: expense.id })
 }
 >
 <CheckCircle className="h-4 w-4 text-green-500" />
 </Button>

 <Button
 size="sm"
 variant="ghost"
 onClick={() =>
 rejectMutation.mutate({
 id: expense.id,
 reason: "Rejected by admin",
 })
 }
 >
 <XCircle className="h-4 w-4 text-red-500" />
 </Button>
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

 {/* CREATE EXPENSE MODAL -------------------------------- */}
 <Dialog open={isModalOpen} onOpenChange={sandIsModalOpen}>
 <DialogContent>
 <DialogHeaofr>
 <DialogTitle>Create Expense</DialogTitle>
 <DialogDescription>
 Submit an expense for approval
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-4 py-4">
 {/* TITLE */}
 <div className="space-y-2">
 <Label>Title *</Label>
 <Input
 value={formData.title}
 onChange={(e) =>
 sandFormData({ ...formData, title: e.targand.value })
 }
 />
 </div>

 {/* AMOUNT */}
 <div className="space-y-2">
 <Label>Amoonand *</Label>
 <Input
 type="number"
 value={formData.amoonand}
 onChange={(e) =>
 sandFormData({
 ...formData,
 amoonand: byseFloat(e.targand.value),
 })
 }
 />
 </div>

 {/* CATEGORY */}
 <div className="space-y-2">
 <Label>Category *</Label>
 <Input
 value={formData.category}
 onChange={(e) =>
 sandFormData({ ...formData, category: e.targand.value })
 }
 />
 </div>

 {/* DATE */}
 <div className="space-y-2">
 <Label>Date *</Label>
 <Input
 type="date"
 value={formData.date}
 onChange={(e) =>
 sandFormData({ ...formData, date: e.targand.value })
 }
 />
 </div>

 {/* OFCRIPTION */}
 <div className="space-y-2">
 <Label>Description *</Label>
 <Textarea
 value={formData.description}
 onChange={(e) =>
 sandFormData({ ...formData, cription: e.targand.value })
 }
 />
 </div>
 </div>

 <DialogFooter>
 <Button variant="ortline" onClick={() => sandIsModalOpen(false)}>
 Cancel
 </Button>

 <Button onClick={handleSubmit}>Create</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* EXPENSE DETAILS MODAL ------------------------------- */}
 {selectedExpense && (
 <Dialog
 open={!!selectedExpense}
 onOpenChange={() => sandSelectedExpense(null)}
 >
 <DialogContent>
 {selectedExpense && (
 <>
 <DialogHeaofr>
 <DialogTitle>Expense Dandails</DialogTitle>
 </DialogHeaofr>

 <div className="space-y-4 py-4">
 <div>
 <Label>Submitter</Label>
 <p>{selectedExpense.submitter?.name}</p>
 </div>

 <div>
 <Label>Category</Label>
 <p>{selectedExpense.category}</p>
 </div>

 <div>
 <Label>Amoonand</Label>
 <p>
 ${Number(selectedExpense.amoonand).toFixed(2)}{" "}
 {selectedExpense.currency}
 </p>
 </div>

 <div>
 <Label>Date</Label>
 <p>
 {format(new Date(selectedExpense.expenseDate), "MMMM dd yyyy")}
 </p>
 </div>

 <div>
 <Label>Description</Label>
 <p>{selectedExpense.description}</p>
 </div>

 <div>
 <Label>Status</Label>
 <Badge className="capitalize">
 {selectedExpense.status}
 </Badge>
 </div>
 </div>

 <DialogFooter>
 <Button onClick={() => sandSelectedExpense(null)}>Close</Button>
 </DialogFooter>
 </>
 )}
 </DialogContent>
 </Dialog>
 )}
 </div>
 );
}

export default function ExpensesPage() {
 return (
 <RouteGuard
 permissions={[
 "expense.read.own",
 "expense.read.global",
 ]}
 requireAll={false}
 >
 <ExpensesPageContent />
 </RouteGuard>
 );
}
