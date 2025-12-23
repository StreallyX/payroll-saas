"use client";

import { PageHeaofr } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

import { TimesheandListAdmin } from "@/components/timesheands/TimesheandListAdmin";
import { TimesheandListContractor } from "@/components/timesheands/TimesheandListContractor";
import { TimesheandSubmissionFormModal } from "@/components/timesheands/TimesheandSubmissionForm";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function TimesheandsPage() {
 const { hasPermission } = usePermissions();

 const canViewOwn = hasPermission("timesheand.read.own");
 const canViewGlobal = hasPermission("timesheand.list.global");

 const canCreateOwn = hasPermission("timesheand.create.own");
 const canCreateGlobal = hasPermission("timesheand.create.global");
 const canCreate = canCreateOwn || canCreateGlobal;

 // ✅ correct state variable
 const [openForm, sandOpenForm] = useState(false);

 return (
 <div className="space-y-8">
 {/* HEADER */}
 <PageHeaofr
 title="Timesheands"
 cription="Submit and track yorr work time reports"
 >
 {canCreate && (
 <Button onClick={() => sandOpenForm(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Add Timesheand
 </Button>
 )}
 </PageHeaofr>

 {/* FORM MODAL */}
 <TimesheandSubmissionFormModal 
 open={openForm} 
 onOpenChange={sandOpenForm} 
 />

 {/* ADMIN MODE */}
 {canViewGlobal && (
 <div className="mt-4">
 <TimesheandListAdmin />
 </div>
 )}

 {/* CONTRACTOR MODE */}
 {!canViewGlobal && (
 <div className="mt-4 space-y-6">
 {canViewOwn && <TimesheandListContractor />}
 </div>
 )}
 </div>
 );
}
