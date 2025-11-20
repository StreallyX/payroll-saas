import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { TRPCError } from "@trpc/server"
import {
  ContractWorkflowStatus,
  isValidTransition,
} from "@/lib/types/contracts"

// =====================================
// PARTICIPANTS SCHEMA
// =====================================
const participantInputSchema = z.object({
  userId: z.string(),
  role: z.string(),                    // contractor, client_admin, approver, etc.
  requiresSignature: z.boolean().optional().default(false),
  isPrimary: z.boolean().optional().default(false),
})
const clean = (obj: any) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );


// =====================================
// CONTRACT ROUTER
// =====================================
export const contractRouter = createTRPCRouter({

  // ======================================================
  // GET ALL (GLOBAL)
  // ======================================================
  getAll: tenantProcedure
    .use(hasPermission("contract.list.global"))
    .query(async ({ ctx }) => {
      return ctx.prisma.contract.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          company: true,           // optionnel
          invoices: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ======================================================
  // GET BY ID
  // ======================================================
  getById: tenantProcedure
    .use(hasPermission("contract.list.global"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          company: true,
          currency: true,
          bank: true,
          contractCountry: true,
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          documents: true,
          statusHistory: { orderBy: { changedAt: "desc" }},
        },
      })

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })
      }

      return contract
    }),

create: tenantProcedure
  .use(hasPermission("contract.create.global"))
  .input(
    z.object({
      companyId: z.string().optional(),
      currencyId: z.string().optional(),
      bankId: z.string().optional(),
      contractCountryId: z.string().optional(),

      title: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),

      status: z.enum(["draft", "active", "completed", "cancelled", "paused"]).optional(),
      workflowStatus: z.enum([
        "draft",
        "pending_agency_sign",
        "pending_contractor_sign",
        "active",
        "paused",
        "completed",
        "cancelled",
        "terminated",
      ]).optional(),

      rate: z.number().optional(),
      rateType: z.enum(["hourly", "daily", "monthly", "fixed"]).optional(),
      rateCycle: z.string().optional(),
      margin: z.number().optional(),
      marginType: z.enum(["percentage", "fixed"]).optional(),
      marginPaidBy: z.enum(["client", "contractor"]).optional(),
      salaryType: z.string().optional(),
      invoiceDueDays: z.number().optional(),

      contractReference: z.string().optional(),
      contractVatRate: z.number().optional(),
      signedContractPath: z.string().optional(),

      startDate: z.date().optional(),
      endDate: z.date().optional(),
      signedAt: z.date().optional(),

      participants: z.array(participantInputSchema).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {

    console.log("📩 CREATE CONTRACT INPUT:", input)

    const userId = ctx.session!.user.id;

    // --- FIX CRUCIAL ---
    const { participants, ...raw } = input;
    const data = clean(raw);

    console.log("🧹 CLEANED INPUT BEFORE INSERT:", data)

    const created = await ctx.prisma.$transaction(async (tx) => {

      const base = await tx.contract.create({
        data: {
          ...data,
          tenantId: ctx.tenantId,
          createdBy: userId,
          assignedTo: userId,
        },
      });

      if (participants?.length) {
        await tx.contractParticipant.createMany({
          data: participants.map((p) => ({
            contractId: base.id,
            userId: p.userId,
            role: p.role,
            requiresSignature: p.requiresSignature ?? false,
            isPrimary: p.isPrimary ?? false,
          })),
        });
      }

      return tx.contract.findFirstOrThrow({
        where: { id: base.id },
        include: {
          participants: { include: { user: true } },
          company: true,
        },
      });
    });

    return created;
  }),



  // ======================================================
  // UPDATE CONTRACT
  // ======================================================
  update: tenantProcedure
    .use(hasPermission("contract.update.global"))
    .input(z.object({
      id: z.string(),
      companyId: z.string().optional(),
      currencyId: z.string().optional(),
      bankId: z.string().optional(),

      title: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),

      status: z.enum(["draft", "active", "completed", "cancelled", "paused"]).optional(),
      workflowStatus: z.enum([
        "draft","pending_agency_sign","pending_contractor_sign","active",
        "paused","completed","cancelled","terminated",
      ]).optional(),

      rate: z.number().optional(),
      rateType: z.string().optional(),
      rateCycle: z.string().optional(),
      margin: z.number().optional(),
      marginType: z.enum(["percentage","fixed"]).optional(),
      marginPaidBy: z.enum(["client","contractor"]).optional(),
      salaryType: z.string().optional(),
      invoiceDueDays: z.number().optional(),

      contractReference: z.string().optional(),
      contractVatRate: z.number().optional(),
      signedContractPath: z.string().optional(),

      startDate: z.date().optional(),
      endDate: z.date().optional(),
      signedAt: z.date().optional(),

      participants: z.array(participantInputSchema).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, participants, ...updateData } = input

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const base = await tx.contract.update({
          where: { id, tenantId: ctx.tenantId },
          data: updateData,
        })

        if (participants) {
          await tx.contractParticipant.deleteMany({ where: { contractId: id }})
          await tx.contractParticipant.createMany({
            data: participants.map((p) => ({
              contractId: id,
              userId: p.userId,
              role: p.role,
              requiresSignature: p.requiresSignature,
              isPrimary: p.isPrimary,
            })),
          })
        }

        return tx.contract.findFirstOrThrow({
          where: { id },
          include: {
            participants: { include: { user: true }},
            company: true,
          },
        })
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: updated.id,
        entityName: updated.title || `Contract-${updated.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // ======================================================
  // DELETE CONTRACT
  // ======================================================
  delete: tenantProcedure
    .use(hasPermission("contract.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.contract.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // ======================================================
  // GET MY CONTRACTS (by participants)
  // ======================================================
  getMyContracts: tenantProcedure
    .use(hasPermission("contract.read.own"))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id

      return ctx.prisma.contract.findMany({
        where: {
          tenantId: ctx.tenantId,
          participants: {
            some: { userId, isActive: true },
          },
        },
        include: {
          participants: { include: { user: true }},
          company: true,
          invoices: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

    getStats: tenantProcedure
    .use(hasPermission("contract.list.global"))
    .query(async ({ ctx }) => {
      const where = { tenantId: ctx.tenantId }

      return {
        total: await ctx.prisma.contract.count({ where }),
        active: await ctx.prisma.contract.count({ where: { ...where, status: "active" }}),
        draft: await ctx.prisma.contract.count({ where: { ...where, status: "draft" }}),
        completed: await ctx.prisma.contract.count({ where: { ...where, status: "completed" }}),
      }
    }),


})
