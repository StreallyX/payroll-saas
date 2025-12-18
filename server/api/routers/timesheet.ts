import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"
import { StateTransitionService } from "@/lib/services/StateTransitionService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"

// ------------------------------------------------------
// PERMISSIONS
// ------------------------------------------------------
const P = {
  READ_OWN: "timesheet.read.own",
  CREATE_OWN: "timesheet.create.own",
  UPDATE_OWN: "timesheet.update.own",
  DELETE_OWN: "timesheet.delete.own",
  SUBMIT_OWN: "timesheet.submit.own",

  LIST_ALL: "timesheet.list.global",
  REVIEW_ALL: "timesheet.review.global",
  APPROVE: "timesheet.approve.global",
  REJECT: "timesheet.reject.global",
  MODIFY_ALL: "timesheet.modify.global",
}

// ------------------------------------------------------
// HELPER: Hide margin data from contractors
// ------------------------------------------------------
function sanitizeTimesheetForContractor(timesheet: any, isAdmin: boolean) {
  if (isAdmin) {
    return timesheet
  }

  // Remove margin-related fields from timesheet response
  const { marginAmount, marginPercentage, ...sanitized } = timesheet
  
  // Also remove margin calculations from contract if included
  if (sanitized.contract) {
    const { margin, marginType, marginPaidBy, ...contractWithoutMargin } = sanitized.contract
    sanitized.contract = contractWithoutMargin
  }

  return sanitized
}

// ------------------------------------------------------
// ROUTER
// ------------------------------------------------------
export const timesheetRouter = createTRPCRouter({

  // ------------------------------------------------------
  // 1️⃣ GET ALL TIMESHEETS — ADMIN / AGENCY
  // ------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(P.LIST_ALL))
    .query(async ({ ctx }) => {
      const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)
      
      const timesheets = await ctx.prisma.timesheet.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          submitter: true,
          contract: {
            select: {
              title: true,   
              contractReference: true,
              margin: isAdmin, // Only include for admins
              marginType: isAdmin,
              marginPaidBy: isAdmin,
              participants: {
                include: { 
                  user: true,
                  company: { select: { name: true } },
                },
              },
            },
          },
          entries: true,
        },
        orderBy: { createdAt: "desc" },
      })
      
      return timesheets.map(ts => sanitizeTimesheetForContractor(ts, isAdmin))
    }),

  // ------------------------------------------------------
  // 2️⃣ GET BY ID (OWN OR GLOBAL)
  // ------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.READ_OWN, P.LIST_ALL]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)
      
      const ts = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          submitter: true,
          contract: {
            select: {
              id: true,
              contractReference: true,
              rate: true,
              rateType: true,
              currency: true,
              margin: isAdmin, // Only include for admins
              marginType: isAdmin,
              marginPaidBy: isAdmin,
              participants: { 
                include: { 
                  user: true,
                  company: true,
                } 
              },
            },
          },
          entries: true,
          documents: true, // Legacy: expense documents
          expenses: true, // 🔥 NEW: Include expenses from Expense table
        },
      })

      if (!ts) throw new TRPCError({ code: "NOT_FOUND" })

      if (!isAdmin && ts.submittedBy !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" })

      return sanitizeTimesheetForContractor(ts, isAdmin)
    }),

  // ------------------------------------------------------
  // 3️⃣ GET MY TIMESHEETS
  // ------------------------------------------------------
  getMyTimesheets: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)
      
      const timesheets = await ctx.prisma.timesheet.findMany({
        where: {
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
        },
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              rate: true,
              rateType: true,
              currency: true,
              margin: isAdmin, // Only include for admins
              marginType: isAdmin,
              marginPaidBy: isAdmin,
              participants: { 
                include: { 
                  user: true,
                  company: true,
                } 
              },
            },
          },
          entries: true,
        },
        orderBy: { createdAt: "desc" },
      })
      
      return timesheets.map(ts => sanitizeTimesheetForContractor(ts, isAdmin))
    }),

 // ------------------------------------------------------
// 10️⃣ CREATE TIMESHEET WITH DATE RANGE (DEEL STYLE)
// ------------------------------------------------------
createRange: tenantProcedure
  .use(hasPermission(P.CREATE_OWN))
  .input(
    z.object({
      contractId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      hoursPerDay: z.string(), // validated later
      notes: z.string().optional(),
      timesheetFileUrl: z.string().optional().nullable(),
      expenseFileUrl: z.string().optional().nullable(),
      // 🔥 NEW: Support for expenses
      expenses: z.array(z.object({
        category: z.string(),
        description: z.string(),
        amount: z.number(),
        receiptUrl: z.string().optional().nullable(),
      })).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {

    const userId = ctx.session.user.id;

    // 1️⃣ Validate contract participation
    const participant = await ctx.prisma.contractParticipant.findFirst({
      where: {
        contractId: input.contractId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to this contract.",
      });
    }

    // 🔥 FIX: Parse and normalize dates to UTC midnight to avoid timezone issues
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    
    // Normalize to UTC midnight to ensure consistent date handling
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    if (start > end) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date.",
      });
    }

    // Hours validation
    const hoursPerDay = Number(input.hoursPerDay);
    if (isNaN(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Hours per day must be between 1 and 24.",
      });
    }

    // 2️⃣ Load contract full details
    const contract = await ctx.prisma.contract.findFirst({
      where: { id: input.contractId, tenantId: ctx.tenantId },
      include: {
        currency: true,
      },
    });

    if (!contract) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." });
    }

    const rate = new Prisma.Decimal(contract.rate ?? 0);
    const rateType = contract.rateType?.toLowerCase() || "daily";

    // Margin system
    const marginValue = new Prisma.Decimal(contract.margin ?? 0);
    const marginType = contract.marginType?.toLowerCase() || "percentage";
    const marginPaidBy = contract.marginPaidBy || "client";

    // 🔥 Construct dynamic file fields
    const fileData: any = {};
    if (input.timesheetFileUrl) fileData.timesheetFileUrl = input.timesheetFileUrl;
    if (input.expenseFileUrl) fileData.expenseFileUrl = input.expenseFileUrl;

    // 3️⃣ Create timesheet (only base fields)
    const ts = await ctx.prisma.timesheet.create({
      data: {
        tenantId: ctx.tenantId,
        contractId: input.contractId,
        submittedBy: userId,
        startDate: start,
        endDate: end,
        status: "draft",
        workflowState: "draft",
        totalHours: new Prisma.Decimal(0),
        baseAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(0),
        marginAmount: new Prisma.Decimal(0),
        ...fileData,
        notes: input.notes || null,
      },
    });

    // 🔥 FIX: Generate daily entries with proper date handling
    // Create a new Date object for each entry to avoid reference issues
    // Use UTC date manipulation to avoid DST and timezone issues
    const entries = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      entries.push({
        timesheetId: ts.id,
        date: new Date(cursor), // 🔥 FIX: Create a NEW Date object for each entry
        hours: new Prisma.Decimal(hoursPerDay),
        amount: null,
      });

      // 🔥 FIX: Use UTC date manipulation to avoid DST issues
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    await ctx.prisma.timesheetEntry.createMany({ data: entries });

    // 5️⃣ Compute total hours
    const totalHours = new Prisma.Decimal(hoursPerDay).mul(entries.length);

    // 6️⃣ Calculate base amount depending on rate type
    let baseAmount = new Prisma.Decimal(0);

    if (rateType === "hourly") {
      baseAmount = totalHours.mul(rate);
    } else if (rateType === "daily") {
      baseAmount = rate.mul(entries.length);
    } else if (rateType === "monthly") {
      // Prorated on 20 working days
      const prorationDays = new Prisma.Decimal(entries.length).div(20);
      baseAmount = rate.mul(prorationDays);
    } else if (rateType === "fixed") {
      baseAmount = rate;
    }

    // 7️⃣ Apply margin
    let marginAmount = new Prisma.Decimal(0);
    let totalWithMargin = baseAmount;

    if (marginValue.gt(0)) {
      if (marginType === "fixed") {
        marginAmount = marginValue;
      } else {
        marginAmount = baseAmount.mul(marginValue).div(100);
      }

      if (marginPaidBy === "client") {
        totalWithMargin = baseAmount.add(marginAmount);
      } else {
        totalWithMargin = baseAmount.sub(marginAmount);
      }
    }

    // 8️⃣ Process expenses if provided - Create Expense entries
    let totalExpenses = new Prisma.Decimal(0);
    
    if (input.expenses && input.expenses.length > 0) {
      // 🔥 NEW: Create Expense entries in the Expense table
      const expenseEntries = input.expenses.map((expense) => ({
        tenantId: ctx.tenantId,
        timesheetId: ts.id,
        contractId: input.contractId,
        submittedBy: userId,
        title: expense.category,
        description: expense.description,
        amount: new Prisma.Decimal(expense.amount),
        currency: contract.currency?.name ?? "USD",
        category: expense.category,
        receiptUrl: expense.receiptUrl,
        expenseDate: start, // Use timesheet start date as expense date
        status: "draft",
      }));

      await ctx.prisma.expense.createMany({
        data: expenseEntries,
      });

      // Calculate total expenses
      totalExpenses = input.expenses.reduce(
        (sum, exp) => sum.add(new Prisma.Decimal(exp.amount)),
        new Prisma.Decimal(0)
      );
    }

    // 9️⃣ Calculate final total including expenses
    const finalTotalAmount = totalWithMargin.add(totalExpenses);

    // 🔟 Save everything back into timesheet
    await ctx.prisma.timesheet.update({
      where: { id: ts.id },
      data: {
        totalHours,
        baseAmount,
        marginAmount,
        totalAmount: finalTotalAmount, // 🔥 FIXED: Now includes expenses
        totalExpenses, // 🔥 NEW: Store total expenses separately
        currency: contract.currency?.name ?? "USD",
      },
    });

    return { success: true, timesheetId: ts.id };
  }),

  // ------------------------------------------------------
  // 5️⃣ UPDATE ENTRY
  // ------------------------------------------------------
  updateEntry: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(
      z.object({
        entryId: z.string(),
        date: z.date().optional(),
        hours: z.number().positive().max(24).optional(),
        description: z.string().optional(),
        projectName: z.string().optional(),
        taskName: z.string().optional(),
        breakHours: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            submittedBy: ctx.session.user.id,
            tenantId: ctx.tenantId,
            status: "draft",
          },
        },
      })

      if (!entry)
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" })

      const updated = await ctx.prisma.timesheetEntry.update({
        where: { id: input.entryId },
        data: {
          ...input,
          hours: input.hours
            ? new Prisma.Decimal(input.hours)
            : undefined,
          breakHours: input.breakHours
            ? new Prisma.Decimal(input.breakHours)
            : undefined,
        },
      })

      // Recalculate hours
      const all = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId },
      })

      const total = all.reduce((sum, e) => sum + Number(e.hours), 0)

      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: new Prisma.Decimal(total) },
      })

      return updated
    }),

  // ------------------------------------------------------
  // 6️⃣ DELETE ENTRY
  // ------------------------------------------------------
  deleteEntry: tenantProcedure
    .use(hasPermission(P.DELETE_OWN))
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            submittedBy: ctx.session.user.id,
            tenantId: ctx.tenantId,
            status: "draft",
          },
        },
      })

      if (!entry)
        throw new TRPCError({ code: "NOT_FOUND" })

      await ctx.prisma.timesheetEntry.delete({
        where: { id: input.entryId },
      })

      // Recalculate
      const all = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId },
      })

      const total = all.reduce((sum, e) => sum + Number(e.hours), 0)

      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: new Prisma.Decimal(total) },
      })

      return { success: true }
    }),

  // ------------------------------------------------------
  // 7️⃣ SUBMIT TIMESHEET (OWN)
  // ------------------------------------------------------
  submitTimesheet: tenantProcedure
    .use(hasPermission(P.SUBMIT_OWN))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const ts = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: { entries: true },
      })

      if (!ts)
        throw new TRPCError({ code: "NOT_FOUND" })

      if (ts.entries.length === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit empty timesheet",
        })

      if (ts.status !== "draft")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timesheet already submitted",
        })

      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "submitted",
          workflowState: "submitted",
          submittedAt: new Date(),
        },
      })
    }),

 approve: tenantProcedure
   .use(hasPermission(P.APPROVE))
   .input(z.object({ id: z.string() }))
   .mutation(async ({ ctx, input }) => {

     // 1️⃣ RELOAD timesheet with contract details
     const ts = await ctx.prisma.timesheet.findFirst({
       where: { id: input.id, tenantId: ctx.tenantId },
       include: {
         contract: {
           include: {
             currency: true,
             participants: {
               include: {
                 user: true,
                 company: true,
               },
             },
           },
         },
         entries: true,
       },
     });

     if (!ts) throw new TRPCError({ code: "NOT_FOUND" });

     // 2️⃣ UPDATE → APPROVE (only change state, don't create invoice)
     await ctx.prisma.timesheet.update({
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
  sendToAgency: tenantProcedure
    .use(hasPermission(P.APPROVE))
    .input(z.object({
      id: z.string(),
      senderId: z.string().optional(), // Optional override
      receiverId: z.string().optional(), // Optional override
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      // 1️⃣ Verify timesheet is approved
      const ts = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              participants: true,
              currency: true,
            },
          },
        },
      });

      if (!ts) throw new TRPCError({ code: "NOT_FOUND" });

      if (ts.workflowState !== "approved") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Timesheet must be approved before sending to agency" 
        });
      }

      // 2️⃣ Check if invoice already exists
      if (ts.invoiceId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Invoice already created for this timesheet" 
        });
      }

      // 3️⃣ Determine Sender and Receiver
      // Sender = person who will receive payment (usually contractor who submitted timesheet)
      // Receiver = entity that will pay the invoice (client or agency)
      
      const senderId = input.senderId || ts.submittedBy; // Default to timesheet submitter
      
      // Find receiver from contract participants
      let receiverId = input.receiverId;
      if (!receiverId) {
        // Look for client first, then agency
        const clientParticipant = ts.contract?.participants?.find((p: any) => p.role === "client");
        const agencyParticipant = ts.contract?.participants?.find((p: any) => p.role === "agency");
        
        const payer = clientParticipant || agencyParticipant;
        if (payer?.userId) {
          receiverId = payer.userId;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not determine invoice receiver. Please specify receiverId.",
          });
        }
      }

      // 4️⃣ Create invoice using the new createFromTimesheet mutation logic
      // This will handle margin calculation, line items, expenses, and documents
      const invoice = await ctx.prisma.$transaction(async (prisma) => {
        // Load timesheet with all related data
        const timesheet = await prisma.timesheet.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
          include: {
            entries: true,
            expenses: true,
            documents: true,
            contract: {
              include: {
                participants: true,
                currency: true,
              },
            },
          },
        });

        if (!timesheet) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Timesheet not found" });
        }

        // Calculate amounts
        const rate = new Prisma.Decimal(timesheet.contract?.rate ?? 0);
        const baseAmount = timesheet.baseAmount || new Prisma.Decimal(0);
        const totalExpenses = timesheet.totalExpenses || new Prisma.Decimal(0);

        // 🔥 FIX: Calculate margin on work amount only (not including expenses)
        // Margin should be calculated on the work/services, not on expenses
        const MarginService = (await import("@/lib/services/MarginService")).MarginService;
        const marginCalculation = await MarginService.calculateMarginFromContract(
          timesheet.contractId!,
          parseFloat(baseAmount.toString()) // Use baseAmount (work only) for margin calculation
        );

        // 🔥 FIX: Total = base work amount + margin + expenses
        const marginAmount = marginCalculation?.marginAmount || new Prisma.Decimal(0);
        const workWithMargin = baseAmount.add(marginAmount);
        const totalAmount = workWithMargin.add(totalExpenses);

        // Prepare line items from timesheet entries
        // 🔥 FIX: Line items should be per day, NOT per hour
        // Rate is already a daily rate, so quantity should be 1 for each day
        const lineItems = [];
        for (const entry of timesheet.entries) {
          lineItems.push({
            description: `Work on ${new Date(entry.date).toISOString().slice(0, 10)} (${entry.hours}h)${entry.description ? ': ' + entry.description : ''}`,
            quantity: new Prisma.Decimal(1), // 🔥 FIX: 1 day, not hours
            unitPrice: rate, // 🔥 Rate is per day
            amount: rate, // 🔥 FIX: Amount is rate per day (not hours * rate)
          });
        }

        // Add expense line items
        if (timesheet.expenses && timesheet.expenses.length > 0) {
          for (const expense of timesheet.expenses) {
            lineItems.push({
              description: `Expense: ${expense.title} - ${expense.description || ''}`,
              quantity: new Prisma.Decimal(1),
              unitPrice: expense.amount,
              amount: expense.amount,
            });
          }
        }


        // Create invoice with currencyId (new) and currency string (legacy)
        const invoice = await prisma.invoice.create({
          data: {
            tenantId: ctx.tenantId,
            contractId: timesheet.contractId,
            timesheetId: timesheet.id,
            createdBy: ctx.session.user.id,
            senderId: senderId,
            receiverId: receiverId,
            
            // 🔥 FIX: Proper amount structure
            baseAmount: baseAmount, // Work amount only (without expenses or margin)
            amount: baseAmount, // Legacy field - same as baseAmount
            marginAmount: marginCalculation?.marginAmount || new Prisma.Decimal(0),
            marginPercentage: marginCalculation?.marginPercentage || new Prisma.Decimal(0),
            marginPaidBy: marginCalculation?.marginPaidBy || "client",
            totalAmount: totalAmount, // Total = baseAmount + marginAmount + expenses
            currencyId: timesheet.contract?.currencyId, // 🔥 NEW: Use currencyId
            
            status: "submitted",
            workflowState: "pending_margin_confirmation",

            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

            description: `Invoice for timesheet ${timesheet.startDate.toISOString().slice(0, 10)} to ${timesheet.endDate.toISOString().slice(0, 10)}`,
            notes: input.notes || `Auto-generated from timesheet. Total hours: ${timesheet.totalHours}. Base amount: ${baseAmount}, Margin: ${marginAmount}, Expenses: ${totalExpenses}, Total: ${totalAmount}`,

            lineItems: {
              create: lineItems,
            },
          },

          // ⭐️ INCLUDE COMPLET POUR RETURN L'INVOICE COMPLÈTE
          include: {
            lineItems: true,
            sender: {
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
            currencyRelation: true, // 🔥 NEW: Include currency relation
          },
        });

        // Create margin entry directly within the transaction
        // 🔥 FIX: Create margin using the transaction's prisma instance
        // to avoid foreign key constraint errors
        if (marginCalculation) {
          await prisma.margin.create({
            data: {
              invoiceId: invoice.id,
              contractId: timesheet.contractId!,
              marginType: marginCalculation.marginType,
              marginPercentage: marginCalculation.marginPercentage,
              marginAmount: marginCalculation.marginAmount,
              calculatedMargin: marginCalculation.calculatedMargin,
              isOverridden: false,
            },
          });
        }

        // Link invoice back to timesheet
        await prisma.timesheet.update({
          where: { id: timesheet.id },
          data: {
            invoiceId: invoice.id,
            workflowState: "sent",
          },
        });

        // 🔥 NEW: Copy documents from timesheet to invoice
        if (timesheet.documents && timesheet.documents.length > 0) {
          const invoiceDocuments = timesheet.documents.map((doc: any) => ({
            invoiceId: invoice.id,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            description: doc.description,
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
  uploadExpenseDocument: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(
      z.object({
        timesheetId: z.string(),
        fileName: z.string(),
        fileBuffer: z.string(), // 🔥 FIX: Accept base64 buffer instead of fileUrl
        fileSize: z.number(),
        mimeType: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional().default("expense"), // expense, timesheet, other
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const ts = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.timesheetId,
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
        },
      });

      if (!ts) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Timesheet not found" });
      }

      // 2. Only allow uploads in draft state
      if (ts.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only upload documents to draft timesheets",
        });
      }

      // 3. 🔥 FIX: Upload file to S3 (matching contract pattern)
      const { uploadFile } = await import("@/lib/s3");
      const buffer = Buffer.from(input.fileBuffer, "base64");
      const s3FileName = `tenant_${ctx.tenantId}/timesheet/${input.timesheetId}/${Date.now()}-${input.fileName}`;
      
      let s3Key: string;
      try {
        s3Key = await uploadFile(buffer, s3FileName, input.mimeType || "application/octet-stream");
      } catch (error) {
        console.error("[uploadExpenseDocument] S3 upload failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file to S3",
        });
      }

      // 4. 🔥 FIX: Create TimesheetDocument record with S3 key
      const document = await ctx.prisma.timesheetDocument.create({
        data: {
          timesheetId: input.timesheetId,
          fileName: input.fileName,
          fileUrl: s3Key, // Store S3 key in fileUrl field
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          description: input.description,
          category: input.category || "expense",
        },
      });

      console.log("[uploadExpenseDocument] Document uploaded successfully:", {
        documentId: document.id,
        timesheetId: input.timesheetId,
        s3Key,
        fileName: input.fileName,
      });

      return document;
    }),

  // ------------------------------------------------------
  // 🆕 DELETE EXPENSE DOCUMENT
  // ------------------------------------------------------
  deleteExpenseDocument: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.timesheetDocument.findFirst({
        where: {
          id: input.documentId,
          timesheet: {
            tenantId: ctx.tenantId,
            submittedBy: ctx.session.user.id,
            status: "draft",
          },
        },
      });

      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.timesheetDocument.delete({
        where: { id: input.documentId },
      });

      return { success: true };
    }),

  // ------------------------------------------------------
  // 🆕 UPDATE TOTAL EXPENSES
  // ------------------------------------------------------
  updateTotalExpenses: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(
      z.object({
        timesheetId: z.string(),
        totalExpenses: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ts = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.timesheetId,
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
          status: "draft",
        },
      });

      if (!ts) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // 🔥 FIXED: Update total expenses and recalculate totalAmount properly
      // totalAmount should include: baseAmount (hours × rate) + marginAmount + expenses
      const baseAmount = new Prisma.Decimal(ts.baseAmount ?? 0);
      const marginAmount = new Prisma.Decimal(ts.marginAmount ?? 0);
      const expenses = new Prisma.Decimal(input.totalExpenses);
      
      // Calculate new total: base + margin + expenses
      const newTotalAmount = baseAmount.add(marginAmount).add(expenses);

      await ctx.prisma.timesheet.update({
        where: { id: input.timesheetId },
        data: {
          totalExpenses: expenses,
          totalAmount: newTotalAmount,
        },
      });

      return { success: true };
    }),

  // ------------------------------------------------------
  // 9️⃣ REJECT TIMESHEET
  // ------------------------------------------------------
  reject: tenantProcedure
    .use(hasPermission(P.REJECT))
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timesheet.update({
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
  getMyTimesheetsPaginated: tenantProcedure
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
          { notes: { contains: search, mode: "insensitive" } },
          { contract: { participants: { some: { company: { name: { contains: search, mode: "insensitive" } } } } } },
        ];
      }

      // Fetch page
      const items = await ctx.prisma.timesheet.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          contract: {
            include: {
              participants: {
                include: {
                  user: true,
                  company: true,
                }
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | null = null;

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
   * Mark timesheet as under review
   */
  reviewTimesheet: tenantProcedure
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
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Request changes to timesheet
   */
  requestChanges: tenantProcedure
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
        metadata: {
          changesRequested: input.changesRequested,
        },
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Modify timesheet amounts (admin only, before approval)
   */
  modifyAmounts: tenantProcedure
    .use(hasPermission(P.MODIFY_ALL))
    .input(z.object({
      id: z.string(),
      totalAmount: z.number().positive(),
      adminModificationNote: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      // Only allow modification in submitted or under_review states
      if (!['submitted', 'under_review'].includes(timesheet.workflowState)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only modify amounts in submitted or under_review state",
        })
      }

      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          adminModifiedAmount: new Prisma.Decimal(input.totalAmount),
          adminModificationNote: input.adminModificationNote,
          modifiedBy: ctx.session.user.id,
          updatedAt: new Date(),
        },
      })
    }),

  /**
   * Get available workflow actions for a timesheet
   */
  getAvailableActions: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      // Check ownership for OWN permissions
      const isOwner = timesheet.submittedBy === ctx.session.user.id

      const result = await StateTransitionService.getAvailableActions(
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
   * Get workflow state history for a timesheet
   */
  getStateHistory: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return StateTransitionService.getStateHistory(
        WorkflowEntityType.TIMESHEET,
        input.id,
        ctx.tenantId
      )
    }),

})