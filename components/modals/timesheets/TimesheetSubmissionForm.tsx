"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 🔥 Placeholder upload — on remplace par ton vrai système
async function uploadFile(file: File | null): Promise<string | null> {
  if (!file) return null;
  // TODO: remplacer par Supabase, UploadThing, S3 etc.
  // Pour l’instant on simule :
  return new Promise((res) => setTimeout(() => res("https://fake-url.com/" + file.name), 500));
}

export function TimesheetSubmissionForm() {
  const [contractId, setContractId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [notes, setNotes] = useState("");
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [expenseFile, setExpenseFile] = useState<File | null>(null);

  const utils = api.useUtils();

  const { data: contracts = [] } = api.contract.getMyContracts.useQuery();

  const create = api.timesheet.createRange.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted for approval");
      utils.timesheet.getMyTimesheets.invalidate();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const reset = () => {
    setStartDate("");
    setEndDate("");
    setHoursPerDay("8");
    setNotes("");
    setTimesheetFile(null);
    setExpenseFile(null);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!contractId) return toast.error("Select a contract");
    if (!startDate || !endDate) return toast.error("Select a period");
    if (new Date(startDate) > new Date(endDate))
      return toast.error("Start date must be before end date");

    // 🔥 1) Upload des fichiers AVANT l'appel TRPC
    const timesheetUrl = await uploadFile(timesheetFile);
    const expenseUrl = await uploadFile(expenseFile);

    // 🔥 2) Appel TRPC avec un OBJET JSON (PAS FormData)
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

  const isSaving = create.isPending;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Submit Timesheet (DEEL Pro)</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CONTRACT SELECT */}
          <div className="space-y-2">
            <Label>Contract *</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract" />
              </SelectTrigger>

              <SelectContent>
                {contracts.map((c: any) => {
                  const main = c.participants?.find((p: any) => p.isPrimary);
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {main?.user?.name} — {c.company?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* PERIOD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* HOURS */}
          <div>
            <Label>Hours per day *</Label>
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
            <Label>Upload Timesheet (PDF)</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setTimesheetFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Expense Sheet (PDF)</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setExpenseFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* NOTES */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Write details about your work…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Timesheet
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
