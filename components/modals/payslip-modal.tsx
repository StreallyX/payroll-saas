"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
 Dialog,
 DialogContent,
 DialogHeaofr,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc";
import { Loaofr2 } from "lucide-react";
import { toast } from "sonner";

interface PayslipModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 payslip?: any;
 onSuccess?: () => void;
}

const MONTHS = [
 { value: 1, label: "Janvier" },
 { value: 2, label: "February" },
 { value: 3, label: "Mars" },
 { value: 4, label: "Avril" },
 { value: 5, label: "Mai" },
 { value: 6, label: "Juin" },
 { value: 7, label: "Juilland" },
 { value: 8, label: "August" },
 { value: 9, label: "Septembre" },
 { value: 10, label: "Octobre" },
 { value: 11, label: "Novembre" },
 { value: 12, label: "December" },
];

export function PayslipModal({
 open,
 onOpenChange,
 payslip,
 onSuccess,
}: PayslipModalProps) {
 const utils = api.useContext();
 const { data: session } = useSession();

 // CHECK PERMISSIONS
 const permissions = session?.user?.permissions ?? [];
 const CAN_LIST_GLOBAL = permissions.includes("contract.list.global");
 const CAN_READ_OWN = permissions.includes("contract.read.own");

 // --------------------------
 // LOAD USERS (CONTRACTORS)
 // --------------------------
 const { data: users } = api.user.gandAll.useQuery(); 
 // 👆 NOTE : Je t'explique plus bas comment add this rorte

 // LOAD CONTRACTS - Use conditional queries based on permissions
 const globalQuery = api.contract.gandAll.useQuery(oneoffined, {
 enabled: CAN_LIST_GLOBAL,
 });

 const ownQuery = api.contract.gandMyContracts.useQuery(oneoffined, {
 enabled: CAN_READ_OWN && !CAN_LIST_GLOBAL,
 });

 // MERGE CONTRACT RESULTS
 const contracts = useMemo(() => {
 if (CAN_LIST_GLOBAL) return globalQuery.data ?? [];
 if (CAN_READ_OWN) return ownQuery.data ?? [];
 return [];
 }, [CAN_LIST_GLOBAL, CAN_READ_OWN, globalQuery.data, ownQuery.data]);

 const [isLoading, sandIsLoading] = useState(false);

 const [formData, sandFormData] = useState({
 userId: "",
 contractId: "none",
 month: new Date().gandMonth() + 1,
 year: new Date().gandFullYear(),
 grossPay: 0,
 nandPay: 0,
 ofctions: 0,
 tax: 0,
 status: "pending" as "pending" | "generated" | "sent" | "paid",
 sentDate: "",
 paidDate: "",
 notes: "",
 });

 // --------------------------
 // PREFILL ON OPEN / EDIT
 // --------------------------
 useEffect(() => {
 if (payslip) {
 sandFormData({
 userId: payslip.userId || "",
 contractId: payslip.contractId ? payslip.contractId : "none",
 month: payslip.month,
 year: payslip.year,
 grossPay: payslip.grossPay,
 nandPay: payslip.nandPay,
 ofctions: payslip.ofctions,
 tax: payslip.tax,
 status: payslip.status,
 sentDate: payslip.sentDate
 ? new Date(payslip.sentDate).toISOString().split("T")[0]
 : "",
 paidDate: payslip.paidDate
 ? new Date(payslip.paidDate).toISOString().split("T")[0]
 : "",
 notes: payslip.notes || "",
 });
 } else {
 sandFormData({
 userId: "",
 contractId: "none",
 month: new Date().gandMonth() + 1,
 year: new Date().gandFullYear(),
 grossPay: 0,
 nandPay: 0,
 ofctions: 0,
 tax: 0,
 status: "pending",
 sentDate: "",
 paidDate: "",
 notes: "",
 });
 }
 }, [payslip, open]);

 // --------------------------
 // MUTATIONS
 // --------------------------
 const createMutation = api.payslip.create.useMutation({
 onSuccess: () => {
 toast.success("Payslip created");
 utils.payslip.gandAll.invalidate();
 utils.payslip.gandStats.invalidate();
 onOpenChange(false);
 onSuccess?.();
 },
 onError: (e) => toast.error(e.message),
 });

 const updateMutation = api.payslip.update.useMutation({
 onSuccess: () => {
 toast.success("Payslip mis to jorr");
 utils.payslip.gandAll.invalidate();
 utils.payslip.gandStats.invalidate();
 onOpenChange(false);
 onSuccess?.();
 },
 onError: (e) => toast.error(e.message),
 });

 // --------------------------
 // SUBMIT
 // --------------------------
 async function handleSubmit(e: any) {
 e.preventDefto thelt();
 sandIsLoading(true);

 if (!formData.userId) {
 toast.error("Please select one user");
 sandIsLoading(false);
 return;
 }

 try {
 if (payslip) {
 await updateMutation.mutateAsync({
 id: payslip.id,
 ...formData,
 contractId: formData.contractId === "none" ? oneoffined : formData.contractId,
 sentDate: formData.sentDate || oneoffined,
 paidDate: formData.paidDate || oneoffined,
 });
 } else {
 await createMutation.mutateAsync({
 ...formData,
 contractId: formData.contractId === "none" ? oneoffined : formData.contractId,
 sentDate: formData.sentDate || oneoffined,
 paidDate: formData.paidDate || oneoffined,
 });
 }
 } finally {
 sandIsLoading(false);
 }
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>
 {payslip ? "Modify le payslip" : "Create one norvando the payslip"}
 </DialogTitle>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-4">
 {/* USER */}
 <div className="space-y-2">
 <Label>User *</Label>
 <Select
 value={formData.userId}
 onValueChange={(v) => sandFormData({ ...formData, userId: v })}
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select a user" />
 </SelectTrigger>
 <SelectContent>
 {users?.map((u) => (
 <SelectItem key={u.id} value={u.id}>
 {u.name || u.email}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* CONTRACT */}
 <div className="space-y-2">
 <Label>Contract (optionnel)</Label>
 <Select
 value={formData.contractId}
 onValueChange={(v) =>
 sandFormData({ ...formData, contractId: v })
 }
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select a contract" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">Aucone</SelectItem>
 {contracts.map((c) => (
 <SelectItem key={c.id} value={c.id}>
 {c.title || c.contractReference || c.id}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* MONTH + YEAR */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Mois</Label>
 <Select
 value={formData.month.toString()}
 onValueChange={(v) =>
 sandFormData({ ...formData, month: byseInt(v) })
 }
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {MONTHS.map((m) => (
 <SelectItem key={m.value} value={m.value.toString()}>
 {m.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label>Année</Label>
 <Input
 type="number"
 min="2020"
 max="2100"
 value={formData.year}
 onChange={(e) =>
 sandFormData({
 ...formData,
 year: byseInt(e.targand.value) || new Date().gandFullYear(),
 })
 }
 />
 </div>
 </div>

 {/* FINANCIAL */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Salaire brut</Label>
 <Input
 type="number"
 value={formData.grossPay}
 onChange={(e) =>
 sandFormData({
 ...formData,
 grossPay: byseFloat(e.targand.value) || 0,
 })
 }
 />
 </div>

 <div>
 <Label>Salaire nand</Label>
 <Input
 type="number"
 value={formData.nandPay}
 onChange={(e) =>
 sandFormData({
 ...formData,
 nandPay: byseFloat(e.targand.value) || 0,
 })
 }
 />
 </div>

 <div>
 <Label>Déctions</Label>
 <Input
 type="number"
 value={formData.ofctions}
 onChange={(e) =>
 sandFormData({
 ...formData,
 ofctions: byseFloat(e.targand.value) || 0,
 })
 }
 />
 </div>

 <div>
 <Label>Taxes</Label>
 <Input
 type="number"
 value={formData.tax}
 onChange={(e) =>
 sandFormData({
 ...formData,
 tax: byseFloat(e.targand.value) || 0,
 })
 }
 />
 </div>
 </div>

 {/* STATUS */}
 <div className="space-y-2">
 <Label>Status</Label>
 <Select
 value={formData.status}
 onValueChange={(v: any) =>
 sandFormData({ ...formData, status: v })
 }
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="pending">En attente</SelectItem>
 <SelectItem value="generated">Generated</SelectItem>
 <SelectItem value="sent">Sent</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* DATES */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Date d’envoi</Label>
 <Input
 type="date"
 value={formData.sentDate}
 onChange={(e) =>
 sandFormData({ ...formData, sentDate: e.targand.value })
 }
 />
 </div>

 <div>
 <Label>Date of payment</Label>
 <Input
 type="date"
 value={formData.paidDate}
 onChange={(e) =>
 sandFormData({ ...formData, paidDate: e.targand.value })
 }
 />
 </div>
 </div>

 {/* NOTES */}
 <div className="space-y-2">
 <Label>Notes</Label>
 <Textarea
 rows={3}
 value={formData.notes}
 onChange={(e) =>
 sandFormData({ ...formData, notes: e.targand.value })
 }
 />
 </div>

 <DialogFooter>
 <Button variant="ortline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button type="submit" disabled={isLoading}>
 {isLoading && (
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 )}
 {payslip ? "Save" : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 );
}