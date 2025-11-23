"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// Fake upload
async function uploadFile(file: File | null): Promise<string | null> {
  if (!file) return null;
  return new Promise((res) => setTimeout(() => res("https://fake-url.com/" + file.name), 500));
}

export function TimesheetSubmissionFormModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [contractId, setContractId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [notes, setNotes] = useState("");
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [expenseFile, setExpenseFile] = useState<File | null>(null);

  const utils = api.useUtils();
  const { data: contracts = [] } = api.contract.getMyContracts.useQuery();

  const reset = () => {
    setContractId("");
    setStartDate("");
    setEndDate("");
    setHoursPerDay("8");
    setNotes("");
    setTimesheetFile(null);
    setExpenseFile(null);
  };

  const create = api.timesheet.createRange.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted");
      utils.timesheet.getMyTimesheets.invalidate();
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async () => {
    if (!contractId) return toast.error("Select a contract");
    if (!startDate || !endDate) return toast.error("Select a period");

    const timesheetUrl = await uploadFile(timesheetFile);
    const expenseUrl = await uploadFile(expenseFile);

    create.mutate({
      contractId,
      startDate,
      endDate,
      hoursPerDay,
      notes: notes || undefined,
      timesheetFileUrl: timesheetUrl || undefined,
      expenseFileUrl: expenseUrl || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Timesheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* CONTRACT */}
          <div className="space-y-2">
            <Label>Contract *</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title || "Contract"} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PERIOD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* HOURS */}
          <div>
            <Label>Hours per day</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
            />
          </div>

          {/* FILE UPLOADS */}
          <div className="space-y-2">
            <Label>Timesheet (PDF)</Label>
            <Input type="file" onChange={(e) => setTimesheetFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-2">
            <Label>Expense sheet (PDF)</Label>
            <Input type="file" onChange={(e) => setExpenseFile(e.target.files?.[0] || null)} />
          </div>

          {/* NOTES */}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
