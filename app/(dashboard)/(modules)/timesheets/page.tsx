"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

import { TimesheetListAdmin } from "@/components/timesheets/TimesheetListAdmin";
import { TimesheetListContractor } from "@/components/timesheets/TimesheetListContractor";
import { TimesheetSubmissionFormModal } from "@/components/timesheets/TimesheetSubmissionForm";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function TimesheetsPage() {
  const { hasPermission } = usePermissions();

  const canViewOwn = hasPermission("timesheet.read.own");
  const canViewGlobal = hasPermission("timesheet.list.global");

  const canCreateOwn = hasPermission("timesheet.create.own");
  const canCreateGlobal = hasPermission("timesheet.create.global");
  const canCreate = canCreateOwn || canCreateGlobal;

  // ✅ correct state variable
  const [openForm, setOpenForm] = useState(false);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title="Timesheets"
        description="Submit and track your work time reports"
      >
        {canCreate && (
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Timesheet
          </Button>
        )}
      </PageHeader>

      {/* FORM MODAL */}
      <TimesheetSubmissionFormModal 
        open={openForm} 
        onOpenChange={setOpenForm} 
      />

      {/* ADMIN MODE */}
      {canViewGlobal && (
        <div className="mt-4">
          <TimesheetListAdmin />
        </div>
      )}

      {/* CONTRACTOR MODE */}
      {!canViewGlobal && (
        <div className="mt-4 space-y-6">
          {canViewOwn && <TimesheetListContractor />}
        </div>
      )}
    </div>
  );
}
