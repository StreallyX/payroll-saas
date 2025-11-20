"use client";

import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";

// ADMIN
import { TimesheetListAdmin } from "@/components/modals/timesheets/TimesheetListAdmin";

// CONTRACTOR
import { TimesheetListContractor } from "@/components/modals/timesheets/TimesheetListContractor";
import { TimesheetSubmissionForm } from "@/components/modals/timesheets/TimesheetSubmissionForm";

export default function TimesheetsPage() {
  const { hasPermission } = usePermissions();

  const canViewOwn = hasPermission("timesheet.read.own");
  const canViewGlobal = hasPermission("timesheet.list.global");
  const canCreateOwn = hasPermission("timesheet.create.own");

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Timesheets"
        description="Manage and review work time reports"
      />

      {/* ADMIN MODE */}
      {canViewGlobal && <TimesheetListAdmin />}

      {/* CONTRACTOR MODE */}
      {!canViewGlobal && (
        <>
          {canCreateOwn && <TimesheetSubmissionForm />}
          {canViewOwn && <TimesheetListContractor />}
        </>
      )}
    </div>
  );
}
