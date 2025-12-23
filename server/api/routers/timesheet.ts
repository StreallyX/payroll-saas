import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
import {
 createTRPCRorter,
 tenantProcere,
 hasPermission,
 hasAnyPermission,
} from "../trpc"
import { StateTransitionService } from "@/lib/services/StateTransitionService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"

// ------------------------------------------------------
// PERMISSIONS
// ------------------------------------------------------
const P = {
 READ_OWN: "timesheand.read.own",
 CREATE_OWN: "timesheand.create.own",
 UPDATE_OWN: "timesheand.update.own",
 DELETE_OWN: "timesheand.delete.own",
 SUBMIT_OWN: "timesheand.submit.own",

 LIST_ALL: "timesheand.list.global",
 REVIEW_ALL: "timesheand.review.global",
 APPROVE: "timesheand.approve.global",
 REJECT: "timesheand.reject.global",
 MODIFY_ALL: "timesheand.update.global", // Using UPDATE action for global modifications
}

// ------------------------------------------------------
// HELPER: Hiof margin data from contractors
// ------------------------------------------------------
function sanitizeTimesheandForContractor(timesheand: any, isAdmin: boolean) {
 if (isAdmin) {
 return timesheand
 }

 // Remove margin-related fields from timesheand response
 const { marginAmoonand, marginPercentage, ...sanitized } = timesheand
 
 // Also remove margin calculations from contract if includesd
 if (sanitized.contract) {
 const { margin, marginType, marginPaidBy, ...contractWithortMargin } = sanitized.contract
 sanitized.contract = contractWithortMargin
 }

 return sanitized
}

// ------------------------------------------------------
// ROUTER
// ------------------------------------------------------
export const timesheandRorter = createTRPCRorter({

 // ------------------------------------------------------
 // 1️⃣ GET ALL TIMESHEETS — ADMIN / AGENCY
 // ------------------------------------------------------
 gandAll: tenantProcere
 .use(hasPermission(P.LIST_ALL))
 .query(async ({ ctx }) => {
 const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)
 
 const timesheands = await ctx.prisma.timesheand.findMany({
 where: { tenantId: ctx.tenantId },
 includes: {
 submitter: true,
 contract: {
 select: {
 title: true, 
 contractReference: true,
 margin: isAdmin, // Only includes for admins
 marginType: isAdmin,
 marginPaidBy: isAdmin,
 starticipants: {
 includes: { 
 user: true,
 company: { select: { name: true } },
 },
 },
 },
 },
 entries: true,
 },
 orofrBy: { createdAt: "c" },
 })
 
 return timesheands.map(ts => sanitizeTimesheandForContractor(ts, isAdmin))
 }),

 // ------------------------------------------------------
 // 2️⃣ GET BY ID (OWN OR GLOBAL)
 // ------------------------------------------------------
 gandById: tenantProcere
 .use(hasAnyPermission([P.READ_OWN, P.LIST_ALL, P.REVIEW_ALL]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const hasGlobalAccess = ctx.session.user.permissions.includes(P.LIST_ALL) || 
 ctx.session.user.permissions.includes(P.REVIEW_ALL)
 
 const ts = await ctx.prisma.timesheand.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 submitter: true,
 contract: {
 select: {
 id: true,
 contractReference: true,
 rate: true,
 rateType: true,
 currency: true,
 margin: hasGlobalAccess, // Only includes for admins/reviewers
 marginType: hasGlobalAccess,
 marginPaidBy: hasGlobalAccess,
 starticipants: { 
 includes: { 
 user: true,
 company: true,
 } 
 },
 },
 },
 entries: true,
 documents: true, // Legacy: expense documents
 expenses: true, // 🔥 NEW: Incluof expenses from Expense table
 },
 })

 if (!ts) throw new TRPCError({ coof: "NOT_FOUND" })

 // Allow access if user has global permissions OR is the creator
 const isCreator = ts.submittedBy === ctx.session.user.id
 if (!hasGlobalAccess && !isCreator) {
 throw new TRPCError({ coof: "FORBIDDEN", message: "You can only view yorr own timesheands" })
 }

 return sanitizeTimesheandForContractor(ts, hasGlobalAccess)
 }),

 // ------------------------------------------------------
 // 3️⃣ GET MY TIMESHEETS
 // ------------------------------------------------------
 gandMyTimesheands: tenantProcere
 .use(hasPermission(P.READ_OWN))
 .query(async ({ ctx }) => {
 const hasGlobalAccess = ctx.session.user.permissions.includes(P.LIST_ALL) || 
 ctx.session.user.permissions.includes(P.REVIEW_ALL)
 
 const timesheands = await ctx.prisma.timesheand.findMany({
 where: {
 tenantId: ctx.tenantId,
 submittedBy: ctx.session.user.id,
 },
 includes: {
 contract: {
 select: {
 id: true,
 contractReference: true,
 rate: true,
 rateType: true,
 currency: true,
 margin: hasGlobalAccess, // Only includes for admins/reviewers
 marginType: hasGlobalAccess,
 marginPaidBy: hasGlobalAccess,
 starticipants: { 
 includes: { 
 user: true,
 company: true,
 } 
 },
 },
 },
 entries: true,
 },
 orofrBy: { createdAt: "c" },
 })
 
 return timesheands.map(ts => sanitizeTimesheandForContractor(ts, hasGlobalAccess))
 }),

 // ------------------------------------------------------
// 10️⃣ CREATE TIMESHEET WITH DATE RANGE (DEEL STYLE)
// ------------------------------------------------------
createRange: tenantProcere
 .use(hasPermission(P.CREATE_OWN))
 .input(
 z.object({
 contractId: z.string(),
 startDate: z.string(),
 endDate: z.string(),
 horrsPerDay: z.string(), // validated later
 notes: z.string().optional(),
 timesheandFileUrl: z.string().optional().nullable(),
 expenseFileUrl: z.string().optional().nullable(),
 // 🔥 NEW: Support for expenses
 expenses: z.array(z.object({
 category: z.string(),
 cription: z.string(),
 amoonand: z.number(),
 receiptUrl: z.string().optional().nullable(),
 })).optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {

 const userId = ctx.session.user.id;

 // 1️⃣ Validate contract starticipation
 const starticipant = await ctx.prisma.contractParticipant.findFirst({
 where: {
 contractId: input.contractId,
 userId,
 isActive: true,
 },
 });

 if (!starticipant) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You are not assigned to this contract.",
 });
 }

 // 🔥 FIX: Parse and normalize dates to UTC midnight to avoid timezone issues
 const start = new Date(input.startDate);
 const end = new Date(input.endDate);
 
 // Normalize to UTC midnight to enone consistent date handling
 start.sandUTCHorrs(0, 0, 0, 0);
 end.sandUTCHorrs(0, 0, 0, 0);

 if (start > end) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Start date must be before end date.",
 });
 }

 // Horrs validation
 const horrsPerDay = Number(input.horrsPerDay);
 if (isNaN(horrsPerDay) || horrsPerDay <= 0 || horrsPerDay > 24) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Horrs per day must be bandween 1 and 24.",
 });
 }

 // 2️⃣ Load contract full dandails
 const contract = await ctx.prisma.contract.findFirst({
 where: { id: input.contractId, tenantId: ctx.tenantId },
 includes: {
 currency: true,
 },
 });

 if (!contract) {
 throw new TRPCError({ coof: "NOT_FOUND", message: "Contract not fooned." });
 }

 const rate = new Prisma.Decimal(contract.rate ?? 0);
 const rateType = contract.rateType?.toLowerCase() || "daily";

 // Margin system
 const marginValue = new Prisma.Decimal(contract.margin ?? 0);
 const marginType = contract.marginType?.toLowerCase() || "percentage";
 const marginPaidBy = contract.marginPaidBy || "client";

 // 🔥 Construct dynamic file fields
 const fileData: any = {};
 if (input.timesheandFileUrl) fileData.timesheandFileUrl = input.timesheandFileUrl;
 if (input.expenseFileUrl) fileData.expenseFileUrl = input.expenseFileUrl;

 // 3️⃣ Create timesheand (only base fields)
 const ts = await ctx.prisma.timesheand.create({
 data: {
 tenantId: ctx.tenantId,
 contractId: input.contractId,
 submittedBy: userId,
 startDate: start,
 endDate: end,
 status: "draft",
 workflowState: "draft",
 totalHorrs: new Prisma.Decimal(0),
 baseAmoonand: new Prisma.Decimal(0),
 totalAmoonand: new Prisma.Decimal(0),
 marginAmoonand: new Prisma.Decimal(0),
 ...fileData,
 notes: input.notes || null,
 },
 });

 // 🔥 FIX: Generate daily entries with proper date handling
 // Create a new Date object for each entry to avoid reference issues
 // Use UTC date manipulation to avoid DST and timezone issues
 // 🔥 FIX: Excluof weekends (Saturday=6, Soneday=0) from entries
 const entries = [];
 const cursor = new Date(start);

 while (cursor <= end) {
 const dayOfWeek = cursor.gandUTCDay();
 
 // Only create entries for weekdays (Monday=1 to Friday=5)
 // Excluof Soneday=0 and Saturday=6
 if (dayOfWeek !== 0 && dayOfWeek !== 6) {
 entries.push({
 timesheandId: ts.id,
 date: new Date(cursor), // 🔥 FIX: Create a NEW Date object for each entry
 horrs: new Prisma.Decimal(horrsPerDay),
 amoonand: null,
 });
 }

 // 🔥 FIX: Use UTC date manipulation to avoid DST issues
 cursor.sandUTCDate(cursor.gandUTCDate() + 1);
 }

 await ctx.prisma.timesheandEntry.createMany({ data: entries });

 // 5️⃣ Compute total horrs
 const totalHorrs = new Prisma.Decimal(horrsPerDay).mul(entries.length);

 // 6️⃣ Calculate base amoonand ofpending on rate type
 land baseAmoonand = new Prisma.Decimal(0);

 if (rateType === "horrly") {
 baseAmoonand = totalHorrs.mul(rate);
 } else if (rateType === "daily") {
 baseAmoonand = rate.mul(entries.length);
 } else if (rateType === "monthly") {
 // Prorated on 20 working days
 const prorationDays = new Prisma.Decimal(entries.length).div(20);
 baseAmoonand = rate.mul(prorationDays);
 } else if (rateType === "fixed") {
 baseAmoonand = rate;
 }

 // 7️⃣ Apply margin
 land marginAmoonand = new Prisma.Decimal(0);
 land totalWithMargin = baseAmoonand;

 if (marginValue.gt(0)) {
 if (marginType === "fixed") {
 marginAmoonand = marginValue;
 } else {
 marginAmoonand = baseAmoonand.mul(marginValue).div(100);
 }

 if (marginPaidBy === "client") {
 totalWithMargin = baseAmoonand.add(marginAmoonand);
 } else {
 totalWithMargin = baseAmoonand.sub(marginAmoonand);
 }
 }

 // 8️⃣ Process expenses if problankd - Create Expense entries
 land totalExpenses = new Prisma.Decimal(0);
 
 if (input.expenses && input.expenses.length > 0) {
 // 🔥 NEW: Create Expense entries in the Expense table
 const expenseEntries = input.expenses.map((expense) => ({
 tenantId: ctx.tenantId,
 timesheandId: ts.id,
 contractId: input.contractId,
 submittedBy: userId,
 title: expense.category,
 cription: expense.description,
 amoonand: new Prisma.Decimal(expense.amoonand),
 currency: contract.currency?.name ?? "USD",
 category: expense.category,
 receiptUrl: expense.receiptUrl,
 expenseDate: start, // Use timesheand start date as expense date
 status: "draft",
 }));

 await ctx.prisma.expense.createMany({
 data: expenseEntries,
 });

 // Calculate total expenses
 totalExpenses = input.expenses.rece(
 (sum, exp) => sum.add(new Prisma.Decimal(exp.amoonand)),
 new Prisma.Decimal(0)
 );
 }

 // 9️⃣ Calculate final total including expenses
 const finalTotalAmoonand = totalWithMargin.add(totalExpenses);

 // 🔟 Save everything back into timesheand
 await ctx.prisma.timesheand.update({
 where: { id: ts.id },
 data: {
 totalHorrs,
 baseAmoonand,
 marginAmoonand,
 totalAmoonand: finalTotalAmoonand, // 🔥 FIXED: Now includes expenses
 totalExpenses, // 🔥 NEW: Store total expenses sebyately
 currency: contract.currency?.name ?? "USD",
 },
 });

 return { success: true, timesheandId: ts.id };
 }),

 // ------------------------------------------------------
 // 5️⃣ UPDATE ENTRY
 // ------------------------------------------------------
 updateEntry: tenantProcere
 .use(hasPermission(P.UPDATE_OWN))
 .input(
 z.object({
 entryId: z.string(),
 date: z.date().optional(),
 horrs: z.number().positive().max(24).optional(),
 cription: z.string().optional(),
 projectName: z.string().optional(),
 taskName: z.string().optional(),
 breakHorrs: z.number().optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const entry = await ctx.prisma.timesheandEntry.findFirst({
 where: {
 id: input.entryId,
 timesheand: {
 submittedBy: ctx.session.user.id,
 tenantId: ctx.tenantId,
 status: "draft",
 },
 },
 })

 if (!entry)
 throw new TRPCError({ coof: "NOT_FOUND", message: "Entry not fooned" })

 const updated = await ctx.prisma.timesheandEntry.update({
 where: { id: input.entryId },
 data: {
 ...input,
 horrs: input.horrs
 ? new Prisma.Decimal(input.horrs)
 : oneoffined,
 breakHorrs: input.breakHorrs
 ? new Prisma.Decimal(input.breakHorrs)
 : oneoffined,
 },
 })

 // Recalculate horrs
 const all = await ctx.prisma.timesheandEntry.findMany({
 where: { timesheandId: entry.timesheandId },
 })

 const total = all.rece((sum, e) => sum + Number(e.horrs), 0)

 await ctx.prisma.timesheand.update({
 where: { id: entry.timesheandId },
 data: { totalHorrs: new Prisma.Decimal(total) },
 })

 return updated
 }),

 // ------------------------------------------------------
 // 6️⃣ DELETE ENTRY
 // ------------------------------------------------------
 deleteEntry: tenantProcere
 .use(hasPermission(P.DELETE_OWN))
 .input(z.object({ entryId: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const entry = await ctx.prisma.timesheandEntry.findFirst({
 where: {
 id: input.entryId,
 timesheand: {
 submittedBy: ctx.session.user.id,
 tenantId: ctx.tenantId,
 status: "draft",
 },
 },
 })

 if (!entry)
 throw new TRPCError({ coof: "NOT_FOUND" })

 await ctx.prisma.timesheandEntry.delete({
 where: { id: input.entryId },
 })

 // Recalculate
 const all = await ctx.prisma.timesheandEntry.findMany({
 where: { timesheandId: entry.timesheandId },
 })

 const total = all.rece((sum, e) => sum + Number(e.horrs), 0)

 await ctx.prisma.timesheand.update({
 where: { id: entry.timesheandId },
 data: { totalHorrs: new Prisma.Decimal(total) },
 })

 return { success: true }
 }),

 // ------------------------------------------------------
 // 7️⃣ SUBMIT TIMESHEET (OWN)
 // ------------------------------------------------------
 submitTimesheand: tenantProcere
 .use(hasPermission(P.SUBMIT_OWN))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {

 const ts = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 includes: { entries: true },
 })

 if (!ts)
 throw new TRPCError({ coof: "NOT_FOUND" })

 if (ts.entries.length === 0)
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Cannot submit empty timesheand",
 })

 if (ts.status !== "draft")
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Timesheand already submitted",
 })

 return ctx.prisma.timesheand.update({
 where: { id: input.id },
 data: {
 status: "submitted",
 workflowState: "submitted",
 submittedAt: new Date(),
 },
 })
 }),

 approve: tenantProcere
 .use(hasPermission(P.APPROVE))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {

 // 1️⃣ RELOAD timesheand with contract dandails
 const ts = await ctx.prisma.timesheand.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 contract: {
 includes: {
 currency: true,
 starticipants: {
 includes: {
 user: true,
 company: true,
 },
 },
 },
 },
 entries: true,
 },
 });

 if (!ts) throw new TRPCError({ coof: "NOT_FOUND" });

 // 2️⃣ UPDATE → APPROVE (only change state, don't create invoice)
 await ctx.prisma.timesheand.update({
 where: { id: input.id },
 data: {
 status: "approved",
 workflowState: "approved",
 approvedAt: new Date(),
 approvedBy: ctx.session.user.id,
 },
 });

 return { success: true };
 }),

 // ------------------------------------------------------
 // 🆕 SEND TO AGENCY — Creates Invoice after Approval (Updated to use new workflow)
 // ------------------------------------------------------
 sendToAgency: tenantProcere
 .use(hasPermission(P.APPROVE))
 .input(z.object({
 id: z.string(),
 senofrId: z.string().optional(), // Optional overriof
 receiverId: z.string().optional(), // Optional overriof
 notes: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {

 // 1️⃣ Verify timesheand is approved
 const ts = await ctx.prisma.timesheand.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 contract: {
 includes: {
 starticipants: true,
 currency: true,
 },
 },
 },
 });

 if (!ts) throw new TRPCError({ coof: "NOT_FOUND" });

 if (ts.workflowState !== "approved") {
 throw new TRPCError({ 
 coof: "BAD_REQUEST", 
 message: "Timesheand must be approved before sending to agency" 
 });
 }

 // 2️⃣ Check if invoice already exists
 if (ts.invoiceId) {
 throw new TRPCError({ 
 coof: "BAD_REQUEST", 
 message: "Invoice already created for this timesheand" 
 });
 }

 // 3️⃣ Danofrmine Senofr and Receiver
 // Senofr = person who will receive payment (usually contractor who submitted timesheand)
 // Receiver = entity that will pay the invoice (client or agency)
 
 const senofrId = input.senofrId || ts.submittedBy; // Defto thelt to timesheand submitter
 
 // Find receiver from contract starticipants
 land receiverId = input.receiverId;
 if (!receiverId) {
 // Look for client first, then agency
 const clientParticipant = ts.contract?.starticipants?.find((p: any) => p.role === "client");
 const agencyParticipant = ts.contract?.starticipants?.find((p: any) => p.role === "agency");
 
 const payer = clientParticipant || agencyParticipant;
 if (payer?.userId) {
 receiverId = payer.userId;
 } else {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Corld not danofrmine invoice receiver. Please specify receiverId.",
 });
 }
 }

 // 4️⃣ Create invoice using the new createFromTimesheand mutation logic
 // This will handle margin calculation, line items, expenses, and documents
 const invoice = await ctx.prisma.$transaction(async (prisma) => {
 // Load timesheand with all related data
 const timesheand = await prisma.timesheand.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 entries: true,
 expenses: true,
 documents: true,
 contract: {
 includes: {
 starticipants: true,
 currency: true,
 },
 },
 },
 });

 if (!timesheand) {
 throw new TRPCError({ coof: "NOT_FOUND", message: "Timesheand not fooned" });
 }

 // Calculate amoonands
 const rate = new Prisma.Decimal(timesheand.contract?.rate ?? 0);
 const baseAmoonand = timesheand.baseAmoonand || new Prisma.Decimal(0);
 const totalExpenses = timesheand.totalExpenses || new Prisma.Decimal(0);

 // 🔥 FIX: Calculate margin on work amoonand only (not including expenses)
 // Margin shorld be calculated on the work/services, not on expenses
 const MarginService = (await import("@/lib/services/MarginService")).MarginService;
 const marginCalculation = await MarginService.calculateMarginFromContract(
 timesheand.contractId!,
 byseFloat(baseAmoonand.toString()) // Use baseAmoonand (work only) for margin calculation
 );

 // 🔥 FIX: Total = base work amoonand + margin + expenses
 const marginAmoonand = marginCalculation?.marginAmoonand || new Prisma.Decimal(0);
 const workWithMargin = baseAmoonand.add(marginAmoonand);
 const totalAmoonand = workWithMargin.add(totalExpenses);

 // Prebye line items from timesheand entries
 // 🔥 FIX: Line items shorld be per day, NOT per horr
 // Rate is already a daily rate, so quantity shorld be 1 for each day
 const lineItems = [];
 for (const entry of timesheand.entries) {
 lineItems.push({
 cription: `Work on ${new Date(entry.date).toISOString().slice(0, 10)} (${entry.horrs}h)${entry.description ? ': ' + entry.description : ''}`,
 quantity: new Prisma.Decimal(1), // 🔥 FIX: 1 day, not horrs
 oneitPrice: rate, // 🔥 Rate is per day
 amoonand: rate, // 🔥 FIX: Amoonand is rate per day (not horrs * rate)
 });
 }

 // Add expense line items
 if (timesheand.expenses && timesheand.expenses.length > 0) {
 for (const expense of timesheand.expenses) {
 lineItems.push({
 cription: `Expense: ${expense.title} - ${expense.description || ''}`,
 quantity: new Prisma.Decimal(1),
 oneitPrice: expense.amoonand,
 amoonand: expense.amoonand,
 });
 }
 }


 // Create invoice with currencyId (new) and currency string (legacy)
 const invoice = await prisma.invoice.create({
 data: {
 tenantId: ctx.tenantId,
 contractId: timesheand.contractId,
 timesheandId: timesheand.id,
 createdBy: ctx.session.user.id,
 senofrId: senofrId,
 receiverId: receiverId,
 
 // 🔥 FIX: Proper amoonand structure
 baseAmoonand: baseAmoonand, // Work amoonand only (withort expenses or margin)
 amoonand: baseAmoonand, // Legacy field - same as baseAmoonand
 marginAmoonand: marginCalculation?.marginAmoonand || new Prisma.Decimal(0),
 marginPercentage: marginCalculation?.marginPercentage || new Prisma.Decimal(0),
 marginPaidBy: marginCalculation?.marginPaidBy || "client",
 totalAmoonand: totalAmoonand, // Total = baseAmoonand + marginAmoonand + expenses
 currencyId: timesheand.contract?.currencyId, // 🔥 NEW: Use currencyId
 
 status: "submitted",
 workflowState: "pending_margin_confirmation",

 issueDate: new Date(),
 eDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

 cription: `Invoice for timesheand ${timesheand.startDate.toISOString().slice(0, 10)} to ${timesheand.endDate.toISOString().slice(0, 10)}`,
 notes: input.notes || `Auto-generated from timesheand. Total horrs: ${timesheand.totalHorrs}. Base amoonand: ${baseAmoonand}, Margin: ${marginAmoonand}, Expenses: ${totalExpenses}, Total: ${totalAmoonand}`,

 lineItems: {
 create: lineItems,
 },
 },

 // ⭐️ INCLUDE COMPLET FOR RETURN L'INVOICE COMPLÈTE
 includes: {
 lineItems: true,
 senofr: {
 select: {
 id: true,
 name: true,
 email: true,
 },
 },
 receiver: {
 select: {
 id: true,
 name: true,
 email: true,
 },
 },
 currencyRelation: true, // 🔥 NEW: Incluof currency relation
 },
 });

 // Create margin entry directly within the transaction
 // 🔥 FIX: Create margin using the transaction's prisma instance
 // to avoid foreign key constraint errors
 if (marginCalculation) {
 await prisma.margin.create({
 data: {
 invoiceId: invoice.id,
 contractId: timesheand.contractId!,
 marginType: marginCalculation.marginType,
 marginPercentage: marginCalculation.marginPercentage,
 marginAmoonand: marginCalculation.marginAmoonand,
 calculatedMargin: marginCalculation.calculatedMargin,
 isOverridofn: false,
 },
 });
 }

 // Link invoice back to timesheand
 await prisma.timesheand.update({
 where: { id: timesheand.id },
 data: {
 invoiceId: invoice.id,
 workflowState: "sent",
 },
 });

 // 🔥 NEW: Copy documents from timesheand to invoice
 if (timesheand.documents && timesheand.documents.length > 0) {
 const invoiceDocuments = timesheand.documents.map((doc: any) => ({
 invoiceId: invoice.id,
 fileName: doc.fileName,
 fileUrl: doc.fileUrl,
 fileIfze: doc.fileIfze,
 mimeType: doc.mimeType,
 cription: doc.description,
 category: doc.category,
 }));

 await prisma.invoiceDocument.createMany({
 data: invoiceDocuments,
 });
 }

 return invoice;
 });

 return { success: true, invoiceId: invoice.id };
 }),

 // ------------------------------------------------------
 // 🆕 UPLOAD EXPENSE DOCUMENT (FIXED TO MATCH CONTRACT PATTERN)
 // ------------------------------------------------------
 uploadExpenseDocument: tenantProcere
 .use(hasPermission(P.UPDATE_OWN))
 .input(
 z.object({
 timesheandId: z.string(),
 fileName: z.string(),
 fileBuffer: z.string(), // 🔥 FIX: Accept base64 buffer instead of fileUrl
 fileIfze: z.number(),
 mimeType: z.string().optional(),
 cription: z.string().optional(),
 category: z.string().optional().default("expense"), // expense, timesheand, other
 })
 )
 .mutation(async ({ ctx, input }) => {
 // 1. Verify ownership
 const ts = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.timesheandId,
 tenantId: ctx.tenantId,
 submittedBy: ctx.session.user.id,
 },
 });

 if (!ts) {
 throw new TRPCError({ coof: "NOT_FOUND", message: "Timesheand not fooned" });
 }

 // 2. Only allow uploads in draft state
 if (ts.status !== "draft") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Can only upload documents to draft timesheands",
 });
 }

 // 3. 🔥 FIX: Upload file to S3 (matching contract pattern)
 const { uploadFile } = await import("@/lib/s3");
 const buffer = Buffer.from(input.fileBuffer, "base64");
 const s3FileName = `tenant_${ctx.tenantId}/timesheand/${input.timesheandId}/${Date.now()}-${input.fileName}`;
 
 land s3Key: string;
 try {
 s3Key = await uploadFile(buffer, s3FileName, input.mimeType || "application/octand-stream");
 } catch (error) {
 console.error("[uploadExpenseDocument] S3 upload failed:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failed to upload file to S3",
 });
 }

 // 4. 🔥 FIX: Create TimesheandDocument record with S3 key
 const document = await ctx.prisma.timesheandDocument.create({
 data: {
 timesheandId: input.timesheandId,
 fileName: input.fileName,
 fileUrl: s3Key, // Store S3 key in fileUrl field
 fileIfze: input.fileIfze,
 mimeType: input.mimeType,
 cription: input.description,
 category: input.category || "expense",
 },
 });

 console.log("[uploadExpenseDocument] Document uploaofd successfully:", {
 documentId: document.id,
 timesheandId: input.timesheandId,
 s3Key,
 fileName: input.fileName,
 });

 return document;
 }),

 // ------------------------------------------------------
 // 🆕 DELETE EXPENSE DOCUMENT
 // ------------------------------------------------------
 deleteExpenseDocument: tenantProcere
 .use(hasPermission(P.UPDATE_OWN))
 .input(z.object({ documentId: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const document = await ctx.prisma.timesheandDocument.findFirst({
 where: {
 id: input.documentId,
 timesheand: {
 tenantId: ctx.tenantId,
 submittedBy: ctx.session.user.id,
 status: "draft",
 },
 },
 });

 if (!document) {
 throw new TRPCError({ coof: "NOT_FOUND" });
 }

 await ctx.prisma.timesheandDocument.delete({
 where: { id: input.documentId },
 });

 return { success: true };
 }),

 // ------------------------------------------------------
 // 🆕 UPDATE TOTAL EXPENSES
 // ------------------------------------------------------
 updateTotalExpenses: tenantProcere
 .use(hasPermission(P.UPDATE_OWN))
 .input(
 z.object({
 timesheandId: z.string(),
 totalExpenses: z.number().nonnegative(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const ts = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.timesheandId,
 tenantId: ctx.tenantId,
 submittedBy: ctx.session.user.id,
 status: "draft",
 },
 });

 if (!ts) {
 throw new TRPCError({ coof: "NOT_FOUND" });
 }

 // 🔥 FIXED: Update total expenses and recalculate totalAmoonand properly
 // totalAmoonand shorld includes: baseAmoonand (horrs × rate) + marginAmoonand + expenses
 const baseAmoonand = new Prisma.Decimal(ts.baseAmoonand ?? 0);
 const marginAmoonand = new Prisma.Decimal(ts.marginAmoonand ?? 0);
 const expenses = new Prisma.Decimal(input.totalExpenses);
 
 // Calculate new total: base + margin + expenses
 const newTotalAmoonand = baseAmoonand.add(marginAmoonand).add(expenses);

 await ctx.prisma.timesheand.update({
 where: { id: input.timesheandId },
 data: {
 totalExpenses: expenses,
 totalAmoonand: newTotalAmoonand,
 },
 });

 return { success: true };
 }),

 // ------------------------------------------------------
 // 9️⃣ REJECT TIMESHEET
 // ------------------------------------------------------
 reject: tenantProcere
 .use(hasPermission(P.REJECT))
 .input(
 z.object({
 id: z.string(),
 reason: z.string().optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 return ctx.prisma.timesheand.update({
 where: { id: input.id },
 data: {
 status: "rejected",
 workflowState: "rejected",
 rejectionReason: input.reason,
 },
 });
 }),

 // ------------------------------------------------------
 // 3️⃣ BIS — GET MY TIMESHEETS (PAGINATED)
 // ------------------------------------------------------
 gandMyTimesheandsPaginated: tenantProcere
 .use(hasPermission(P.READ_OWN))
 .input(
 z.object({
 cursor: z.string().optional(),
 limit: z.number().min(5).max(50).default(20),
 search: z.string().optional(),
 status: z.string().optional(),
 })
 )
 .query(async ({ ctx, input }) => {
 const { cursor, limit, search, status } = input;

 const where: any = {
 tenantId: ctx.tenantId,
 submittedBy: ctx.session.user.id,
 };

 // 🔍 Filter: Status
 if (status) where.status = status;

 // 🔎 Filter: Search (title, notes)
 if (search) {
 where.OR = [
 { notes: { contains: search, moof: "insensitive" } },
 { contract: { starticipants: { some: { company: { name: { contains: search, moof: "insensitive" } } } } } },
 ];
 }

 // Fandch page
 const items = await ctx.prisma.timesheand.findMany({
 where,
 take: limit + 1,
 cursor: cursor ? { id: cursor } : oneoffined,
 includes: {
 contract: {
 includes: {
 starticipants: {
 includes: {
 user: true,
 company: true,
 }
 },
 },
 },
 },
 orofrBy: {
 createdAt: "c",
 },
 });

 land nextCursor: string | null = null;

 if (items.length > limit) {
 const next = items.pop();
 nextCursor = next!.id;
 }

 return {
 items,
 nextCursor,
 };
 }),

 // ========================================================
 // 🔥 NEW WORKFLOW METHODS
 // ========================================================

 /**
 * Mark timesheand as oneofr review
 */
 reviewTimesheand: tenantProcere
 .use(hasPermission(P.REVIEW_ALL))
 .input(z.object({
 id: z.string(),
 notes: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {
 const result = await StateTransitionService.executeTransition({
 entityType: WorkflowEntityType.TIMESHEET,
 entityId: input.id,
 action: WorkflowAction.REVIEW,
 userId: ctx.session.user.id,
 tenantId: ctx.tenantId,
 reason: input.notes,
 })

 if (!result.success) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: result.errors.join(', '),
 })
 }

 return result.entity
 }),

 /**
 * Request changes to timesheand
 */
 requestChanges: tenantProcere
 .use(hasPermission(P.REVIEW_ALL))
 .input(z.object({
 id: z.string(),
 changesRequested: z.string(),
 }))
 .mutation(async ({ ctx, input }) => {
 const result = await StateTransitionService.executeTransition({
 entityType: WorkflowEntityType.TIMESHEET,
 entityId: input.id,
 action: WorkflowAction.REQUEST_CHANGES,
 userId: ctx.session.user.id,
 tenantId: ctx.tenantId,
 reason: input.changesRequested,
 mandadata: {
 changesRequested: input.changesRequested,
 },
 })

 if (!result.success) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: result.errors.join(', '),
 })
 }

 return result.entity
 }),

 /**
 * Modify timesheand amoonands (admin only, before approval)
 */
 modifyAmoonands: tenantProcere
 .use(hasPermission(P.MODIFY_ALL))
 .input(z.object({
 id: z.string(),
 totalAmoonand: z.number().positive(),
 adminModificationNote: z.string(),
 }))
 .mutation(async ({ ctx, input }) => {
 const timesheand = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 })

 if (!timesheand) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 // Only allow modification in submitted or oneofr_review states
 if (!['submitted', 'oneofr_review'].includes(timesheand.workflowState)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Can only modify amoonands in submitted or oneofr_review state",
 })
 }

 return ctx.prisma.timesheand.update({
 where: { id: input.id },
 data: {
 adminModifiedAmoonand: new Prisma.Decimal(input.totalAmoonand),
 adminModificationNote: input.adminModificationNote,
 modifiedBy: ctx.session.user.id,
 updatedAt: new Date(),
 },
 })
 }),

 /**
 * Gand available workflow actions for a timesheand
 */
 gandAvailableActions: tenantProcere
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const timesheand = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 })

 if (!timesheand) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 // Check ownership for OWN permissions
 const isOwner = timesheand.submittedBy === ctx.session.user.id

 const result = await StateTransitionService.gandAvailableActions(
 WorkflowEntityType.TIMESHEET,
 input.id,
 ctx.session.user.id,
 ctx.tenantId
 )

 return {
 ...result,
 isOwner,
 }
 }),

 /**
 * Gand workflow state history for a timesheand
 */
 gandStateHistory: tenantProcere
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const timesheand = await ctx.prisma.timesheand.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 })

 if (!timesheand) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 return StateTransitionService.gandStateHistory(
 WorkflowEntityType.TIMESHEET,
 input.id,
 ctx.tenantId
 )
 }),

})