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
// ROUTER
// ------------------------------------------------------
export const timesheetRouter = createTRPCRouter({

  // ------------------------------------------------------
  // 1️⃣ GET ALL TIMESHEETS — ADMIN / AGENCY
  // ------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(P.LIST_ALL))
    .query(async ({ ctx }) => {
      return ctx.prisma.timesheet.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          submitter: true,
          contract: {
            select: {
              contractReference: true,
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
    }),

  // ------------------------------------------------------
  // 2️⃣ GET BY ID (OWN OR GLOBAL)
  // ------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.READ_OWN, P.LIST_ALL]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ts = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          submitter: true,
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
          entries: true,
          documents: true, // 🔥 NEW: Include expense documents
        },
      })

      if (!ts) throw new TRPCError({ code: "NOT_FOUND" })

      const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)

      if (!isAdmin && ts.submittedBy !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" })

      return ts
    }),

  // ------------------------------------------------------
  // 3️⃣ GET MY TIMESHEETS
  // ------------------------------------------------------
  getMyTimesheets: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.timesheet.findMany({
        where: {
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
        },
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
          entries: true,
        },
        orderBy: { createdAt: "desc" },
      })
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

    // Dates
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

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

    // 4️⃣ Generate daily entries
    const entries = [];
    let cursor = new Date(start);

    while (cursor <= end) {
      entries.push({
        timesheetId: ts.id,
        date: cursor,
        hours: new Prisma.Decimal(hoursPerDay),
        amount: null,
      });

      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
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

    // 8️⃣ Save everything back into timesheet
    await ctx.prisma.timesheet.update({
      where: { id: ts.id },
      data: {
        totalHours,
        baseAmount,
        marginAmount,
        totalAmount: totalWithMargin,
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
  // 🆕 SEND TO AGENCY — Creates Invoice after Approval
  // ------------------------------------------------------
  sendToAgency: tenantProcedure
    .use(hasPermission(P.APPROVE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      // 1️⃣ RELOAD timesheet with contract details and documents
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
          documents: true, // 🔥 NEW: Include expense documents
        },
      });

      if (!ts) throw new TRPCError({ code: "NOT_FOUND" });

      // 2️⃣ Verify timesheet is approved
      if (ts.workflowState !== "approved") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Timesheet must be approved before sending to agency" 
        });
      }

      // 3️⃣ Check if invoice already exists
      if (ts.invoiceId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Invoice already created for this timesheet" 
        });
      }

      const userId = ts.submittedBy;
      const currency = ts.contract?.currency?.name ?? "USD";
      const contractorName = ts.contract?.participants.find(p => p.userId === userId)?.user?.name ?? "Contractor";
      const agencyParticipant = ts.contract?.participants.find(p => p.role === "agency");

      // 🔥 Calculate base amount from hours worked
      const rate = new Prisma.Decimal(ts.contract?.rate ?? 0);
      const rateType = ts.contract?.rateType?.toLowerCase() || "hourly";
      let baseAmount = new Prisma.Decimal(0);

      if (rateType === "hourly") {
        baseAmount = ts.totalHours.mul(rate);
      } else if (rateType === "daily") {
        baseAmount = rate.mul(ts.entries.length);
      } else if (rateType === "monthly") {
        const prorationDays = new Prisma.Decimal(ts.entries.length).div(20);
        baseAmount = rate.mul(prorationDays);
      } else if (rateType === "fixed") {
        baseAmount = rate;
      }

      // 🔥 Add expenses to base amount
      const totalExpenses = ts.totalExpenses ?? new Prisma.Decimal(0);
      const subtotalWithExpenses = baseAmount.add(totalExpenses);

      // Use admin modified amount if available, otherwise use calculated amount
      const finalBaseAmount = ts.adminModifiedAmount ?? subtotalWithExpenses;

      // Calculate margin
      let marginAmount = new Prisma.Decimal(0);
      let marginPercentage = new Prisma.Decimal(0);
      let totalWithMargin = finalBaseAmount;
      
      if (ts.contract?.margin) {
        if (ts.contract.marginType?.toLowerCase() === "fixed") {
          marginAmount = ts.contract.margin;
          marginPercentage = finalBaseAmount.gt(0) 
            ? ts.contract.margin.div(finalBaseAmount).mul(100) 
            : new Prisma.Decimal(0);
        } else {
          marginPercentage = ts.contract.margin;
          marginAmount = finalBaseAmount.mul(ts.contract.margin).div(100);
        }

        // Add margin if paid by client, subtract if paid by contractor
        if (ts.contract.marginPaidBy === "client") {
          totalWithMargin = finalBaseAmount.add(marginAmount);
        } else if (ts.contract.marginPaidBy === "contractor") {
          totalWithMargin = finalBaseAmount.sub(marginAmount);
        }
      }

      // 4️⃣ CREATE PROFESSIONAL INVOICE
      if (ts.contractId) {
        // Prepare line items
        const lineItems = [];

        // Add work hours line items
        ts.entries.forEach((entry) => {
          lineItems.push({
            description: `Work on ${new Date(entry.date).toISOString().slice(0,10)}${entry.description ? ': ' + entry.description : ''}`,
            quantity: entry.hours,
            unitPrice: rate,
            amount: entry.hours.mul(rate),
          });
        });

        // 🔥 Add expense line items with document references
        if (totalExpenses.gt(0) && ts.documents.length > 0) {
          ts.documents.forEach((doc, index) => {
            lineItems.push({
              description: `Expense File ${index + 1}: ${doc.description || doc.fileName}`,
              quantity: new Prisma.Decimal(1),
              unitPrice: new Prisma.Decimal(0), // Will be set from expense amount if available
              amount: new Prisma.Decimal(0), // Individual expense amounts
            });
          });

          // Add total expenses as a summary line
          lineItems.push({
            description: `Total Expenses (${ts.documents.length} document${ts.documents.length > 1 ? 's' : ''})`,
            quantity: new Prisma.Decimal(1),
            unitPrice: totalExpenses,
            amount: totalExpenses,
          });
        }

        const invoice = await ctx.prisma.invoice.create({
          data: {
            tenantId: ctx.tenantId,
            contractId: ts.contractId,
            createdBy: userId,

            // Amounts with margin calculation
            baseAmount: baseAmount, // Hours only
            marginAmount: marginAmount,
            marginPercentage: marginPercentage,
            marginPaidBy: ts.contract?.marginPaidBy,
            amount: finalBaseAmount, // Hours + Expenses
            totalAmount: totalWithMargin, // Final amount with margin
            currency,

            // Workflow state - set to submitted/pending approval
            status: "submitted",
            workflowState: "for_approval",

            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

            description: `Invoice for ${contractorName} - Period: ${ts.startDate.toISOString().slice(0,10)} to ${ts.endDate.toISOString().slice(0,10)}`,
            notes: `Generated from approved timesheet.
            
📊 Summary:
• Total Hours: ${ts.totalHours}
• Hourly/Daily Rate: ${rate} ${currency}
• Subtotal (Hours): ${baseAmount} ${currency}
${totalExpenses.gt(0) ? `• Expenses: ${totalExpenses} ${currency} (${ts.documents.length} document${ts.documents.length > 1 ? 's' : ''})` : ''}
• Base Amount: ${finalBaseAmount} ${currency}
${marginAmount.gt(0) ? `• Margin (${marginPercentage.toFixed(2)}%): ${marginAmount} ${currency}` : ''}
• Total Amount: ${totalWithMargin} ${currency}

${agencyParticipant ? `📧 Agency: ${agencyParticipant.company?.name || agencyParticipant.user?.name}` : ''}
${ts.documents.length > 0 ? `\n📎 Expense Documents:\n${ts.documents.map((d, i) => `  ${i + 1}. ${d.fileName}`).join('\n')}` : ''}`,
            
            timesheets: {
              connect: { id: ts.id },
            },

            // Create line items
            lineItems: {
              create: lineItems,
            },
          },
        });

        // Link invoice back to timesheet and update workflow state
        await ctx.prisma.timesheet.update({
          where: { id: ts.id },
          data: { 
            invoiceId: invoice.id,
            workflowState: "sent",
          },
        });

        return { success: true, invoiceId: invoice.id };
      }

      throw new TRPCError({ 
        code: "BAD_REQUEST", 
        message: "Cannot create invoice without contract" 
      });
    }),

  // ------------------------------------------------------
  // 🆕 UPLOAD EXPENSE DOCUMENT
  // ------------------------------------------------------
  uploadExpenseDocument: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(
      z.object({
        timesheetId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        mimeType: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
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

      // Only allow uploads in draft state
      if (ts.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only upload documents to draft timesheets",
        });
      }

      const document = await ctx.prisma.timesheetDocument.create({
        data: {
          timesheetId: input.timesheetId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          description: input.description,
          category: "expense",
        },
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

      // Update total expenses and recalculate totalAmount
      const rate = new Prisma.Decimal(ts.baseAmount ?? 0);
      const expenses = new Prisma.Decimal(input.totalExpenses);
      const newTotalAmount = rate.add(expenses);

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