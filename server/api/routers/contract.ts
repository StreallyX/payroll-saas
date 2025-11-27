import { z } from "zod"
import { TRPCError } from "@trpc/server"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

// =======================================================
// PERMISSIONS MAP
// =======================================================
const P = {
  // SOW (contrats opérationnels)
  CONTRACT: {
    LIST_GLOBAL:   "contract.list.global",
    READ_OWN:      "contract.read.own",
    CREATE_GLOBAL: "contract.create.global",
    UPDATE_OWN:    "contract.update.own",
    UPDATE_GLOBAL: "contract.update.global",
    DELETE_GLOBAL: "contract.delete.global",
    SEND_GLOBAL:   "contract.send.global",
    SIGN_OWN:      "contract.sign.own",
    APPROVE_GLOBAL:"contract.approve.global",
    CANCEL_GLOBAL: "contract.cancel.global",
    EXPORT_GLOBAL: "contract.export.global",
    PARTICIPANT_GLOBAL: "contract_participant.manage.global",
  },
  // MSA (cadres)
  MSA: {
    LIST_GLOBAL:   "contract_msa.list.global",
    CREATE_GLOBAL: "contract_msa.create.global",
    UPDATE_GLOBAL: "contract_msa.update.global",
    DELETE_GLOBAL: "contract_msa.delete.global",
  },
}

// =======================================================
// SCHEMAS
// =======================================================
const participantInputSchema = z.object({
  userId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  role: z.string(), // contractor, client_admin, approver, agency, payroll_partner, etc.
  requiresSignature: z.boolean().optional().default(false),
  isPrimary: z.boolean().optional().default(false),
})
.refine((data) => {
  // 🔥 VALIDATION : Au moins userId OU companyId doit être présent
  if (!data.userId && !data.companyId) {
    return false
  }
  return true
}, {
  message: "Au moins userId ou companyId doit être fourni pour un participant."
})
.refine((data) => {
  // 🔥 VALIDATION CRITIQUE : Les approvers ne doivent JAMAIS avoir requiresSignature: true
  if (data.role === "approver" && data.requiresSignature === true) {
    return false
  }
  return true
}, {
  message: "Les approvers ne peuvent pas avoir requiresSignature: true. Utilisez le champ 'approved' pour les approbations."
})

const baseContractSchema = z.object({
  type: z.enum(["msa", "sow"]).default("sow"),
  parentId: z.string().optional().nullable(), // SOW -> parent MSA, MSA -> null

  // GENERAL
  companyId: z.string().optional().nullable(),
  currencyId: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  contractCountryId: z.string().optional().nullable(),

  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  status: z.enum(["draft", "pending_approval", "pending_signature", "active", "completed", "cancelled", "paused"]).optional(),
  workflowStatus: z.enum([
    "draft",
    "pending_approval", // 🔥 Ajouté pour le workflow d'approbation
    "pending_signature", // 🔥 Ajouté pour le workflow de signature
    "pending_agency_sign",
    "pending_contractor_sign",
    "active",
    "paused",
    "completed",
    "cancelled",
    "terminated",
  ]).optional(),

  rate: z.number().optional().nullable(),
  rateType: z.enum(["hourly", "daily", "monthly", "fixed"]).optional().nullable(),
  rateCycle: z.string().optional().nullable(),
  margin: z.number().optional().nullable(),
  marginType: z.enum(["percentage", "fixed"]).optional().nullable(),
  marginPaidBy: z.enum(["client", "contractor"]).optional().nullable(),

  salaryType: z.string().optional().nullable(),
  invoiceDueDays: z.number().optional().nullable(),

  contractReference: z.string().optional().nullable(),
  contractVatRate: z.number().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  signedAt: z.date().optional().nullable(),

  // ============================
  // 🔥 MSA-SPECIFIC FIELDS
  // ============================
  feePayer: z.string().optional().nullable(),                // "client" | "worker" (libre pour l’instant)
  payrollModes: z.array(z.string()).optional().default([]),  // ["employed","gross","split"]
  extraFees: z.array(z.string()).optional().default([]),     // ["visa","annual_tax","onboarding"]

  requireDeposit: z.boolean().optional().nullable(),
  proofOfPayment: z.boolean().optional().nullable(),
  selfBilling: z.boolean().optional().nullable(),

  timesheetPolicy: z.string().optional().nullable(), // "required" | "optional" | "not_used"

  portalCanViewWorkers: z.boolean().optional().nullable(),
  portalCanUploadSelfBill: z.boolean().optional().nullable(),
  portalCanUploadPaymentProof: z.boolean().optional().nullable(),

  // PARTICIPANTS
  participants: z.array(participantInputSchema).optional(),
})

const updateContractSchema = baseContractSchema.extend({
  id: z.string(),
})

const idSchema = z.object({ id: z.string() })

// =======================================================
// HELPERS
// =======================================================
const clean = (obj: any) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  )

async function ensureIsParticipantActive(ctx: any, contractId: string, userId: string) {
  const exists = await ctx.prisma.contractParticipant.findFirst({
    where: { contractId, userId, isActive: true }
  })
  if (!exists) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant of this contract." })
  }
}

function isDraft(contract: any) {
  return contract?.status === "draft" || contract?.workflowStatus === "draft"
}

function assert(condition: any, message: string, code: "BAD_REQUEST" | "FORBIDDEN" = "BAD_REQUEST") {
  if (!condition) throw new TRPCError({ code, message })
}

async function ensureTypePermission(
  ctx: any,
  type: "msa" | "sow",
  action: keyof typeof P["CONTRACT"]
) {
  const perms: string[] = ctx.session.user.permissions || []
  if (type === "msa") {
    // map action to MSA permissions
    switch (action) {
      case "CREATE_GLOBAL":
        assert(perms.includes(P.MSA.CREATE_GLOBAL), "Missing permission: contract_msa.create.global", "FORBIDDEN")
        break
      case "UPDATE_GLOBAL":
        assert(perms.includes(P.MSA.UPDATE_GLOBAL), "Missing permission: contract_msa.update.global", "FORBIDDEN")
        break
      case "DELETE_GLOBAL":
        assert(perms.includes(P.MSA.DELETE_GLOBAL), "Missing permission: contract_msa.delete.global", "FORBIDDEN")
        break
      default:
        break
    }
  } else {
    // SOW → normal contract perms already enforced at procedure level
    return
  }
}

// =======================================================
// ROUTER
// =======================================================
export const contractRouter = createTRPCRouter({

  // -------------------------------------------------------
  // LIST (GLOBAL) — SOW + MSA (option type filter)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.LIST_GLOBAL, P.MSA.LIST_GLOBAL]))
    .input(z.object({
      type: z.enum(["msa", "sow"]).optional(),
      search: z.string().optional(),
      companyId: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId }
      if (input?.type) where.type = input.type
      if (input?.companyId) where.companyId = input.companyId
      if (input?.status) where.status = input.status
      if (input?.search) {
        const q = input.search
        where.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { contractReference: { contains: q, mode: "insensitive" } },
          { participants: { some: { user: { name: { contains: q, mode: "insensitive" } } } } },
          { participants: { some: { company: { name: { contains: q, mode: "insensitive" } } } } },
        ]
      }

      return ctx.prisma.contract.findMany({
        where,
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              company: { select: { id: true, name: true } },
            }
          },
          company: true,
          parent: { select: { id: true, title: true, type: true } },
          children: { select: { id: true, title: true, type: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET BY ID (GLOBAL or OWN participant)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.LIST_GLOBAL, P.CONTRACT.READ_OWN, P.MSA.LIST_GLOBAL]))
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      // global if user has list right on CONTRACT or MSA
      const hasGlobal =
        user.permissions.includes(P.CONTRACT.LIST_GLOBAL) ||
        user.permissions.includes(P.MSA.LIST_GLOBAL)

      const contract = await ctx.prisma.contract.findFirst({
        where: hasGlobal
          ? { id, tenantId }
          : { id, tenantId, participants: { some: { userId: user.id, isActive: true } } },
        include: {
          company: true,
          currency: true,
          bank: true,
          contractCountry: true,
          parent: { select: { id: true, type: true, title: true } },
          children: { select: { id: true, type: true, title: true, status: true } },
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              company: { select: { id: true, name: true } },
            }
          },
          statusHistory: { orderBy: { changedAt: "desc" } },
        },
      })

      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })
      return contract
    }),

  // -------------------------------------------------------
  // CREATE (GLOBAL) — supports MSA or SOW (+ optional parent MSA)
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.CREATE_GLOBAL, P.MSA.CREATE_GLOBAL]))
    .input(baseContractSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      await ensureTypePermission(ctx, input.type, "CREATE_GLOBAL")

      // règles de parentage
      if (input.type === "sow" && input.parentId) {
        const parent = await ctx.prisma.contract.findFirst({
          where: { id: input.parentId, tenantId: ctx.tenantId },
          select: { id: true, type: true },
        })
        assert(parent, "Parent MSA introuvable", "BAD_REQUEST")
        assert(parent!.type === "msa", "Le parent doit être un MSA", "BAD_REQUEST")
      }
      if (input.type === "msa") {
        // sécurité : un MSA n'a pas de parent
        assert(!input.parentId, "Un MSA ne peut pas avoir de parent", "BAD_REQUEST")
      }

      const { participants, ...raw } = input
      const data = clean(raw)

      const created = await ctx.prisma.$transaction(async (tx) => {
        const base = await tx.contract.create({
          data: {
            ...data,
            tenantId: ctx.tenantId!,
            createdBy: userId,
            assignedTo: userId,
          },
        })

        if (participants?.length) {
          await tx.contractParticipant.createMany({
            data: participants.map(p => ({
              contractId: base.id,
              userId: p.userId || null,
              companyId: p.companyId || null,
              role: p.role,
              requiresSignature: p.role === "approver" ? false : (p.requiresSignature ?? false), // 🔥 Approvers ne peuvent JAMAIS avoir requiresSignature
              approved: false, // 🔥 Initialisé à false, passera à true quand l'approver approuve
              isPrimary: p.isPrimary ?? false,
            })),
          })
        }

        return tx.contract.findFirstOrThrow({
          where: { id: base.id },
          include: {
            participants: {
              include: {
                user: true,
                company: true,
              }
            },
            company: true,
          },
        })
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: created.id,
        entityName: created.title ?? `Contract-${created.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return created
    }),

  // -------------------------------------------------------
  // UPDATE — GLOBAL or OWN (OWN seulement si draft)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.UPDATE_GLOBAL, P.CONTRACT.UPDATE_OWN, P.MSA.UPDATE_GLOBAL]))
    .input(updateContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, participants, ...updates } = input
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const current = await ctx.prisma.contract.findFirst({
        where: { id, tenantId },
        include: { participants: true },
      })
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })

      // permission par type
      const isMSA = current.type === "msa"
      if (isMSA) {
        // MSA → update global seulement
        if (!user.permissions.includes(P.MSA.UPDATE_GLOBAL)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Missing contract_msa.update.global" })
        }
        // sécurité : on évite de lier un parent à un MSA
        if (updates.parentId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Un MSA ne peut pas avoir de parent" })
        }
      } else {
        // SOW → update global ou own (draft-only)
        const canGlobal = user.permissions.includes(P.CONTRACT.UPDATE_GLOBAL)
        if (!canGlobal) {
          if (!user.permissions.includes(P.CONTRACT.UPDATE_OWN)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Missing contract.update.own" })
          }
          await ensureIsParticipantActive(ctx, id, user.id)
          assert(isDraft(current), "OWN update only allowed on DRAFT contracts", "FORBIDDEN")
        }
        // si on modifie parentId sur un SOW → le parent doit rester un MSA
        if (updates.parentId) {
          const parent = await ctx.prisma.contract.findFirst({
            where: { id: updates.parentId, tenantId },
            select: { id: true, type: true },
          })
          assert(parent, "Parent MSA introuvable", "BAD_REQUEST")
          assert(parent!.type === "msa", "Le parent doit être un MSA", "BAD_REQUEST")
        }
      }

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const base = await tx.contract.update({
          where: { id },
          data: clean(updates),
        })

        if (participants) {
          await tx.contractParticipant.deleteMany({ where: { contractId: id } })
          if (participants.length) {
            await tx.contractParticipant.createMany({
              data: participants.map(p => ({
                contractId: id,
                userId: p.userId || null,
                companyId: p.companyId || null,
                role: p.role,
                requiresSignature: p.role === "approver" ? false : (p.requiresSignature ?? false),
                approved: false,
                isPrimary: p.isPrimary ?? false,
              })),
            })
          }
        }

        return tx.contract.findFirstOrThrow({
          where: { id },
          include: {
            participants: {
              include: {
                user: true,
                company: true,
              }
            },
            company: true,
          },
        })
      })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: updated.id,
        entityName: updated.title ?? `Contract-${updated.id.slice(0, 6)}`,
        tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // DELETE — GLOBAL (draft only)
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.DELETE_GLOBAL, P.MSA.DELETE_GLOBAL]))
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { id: true, status: true, workflowStatus: true, type: true, title: true },
      })
      if (!current) throw new TRPCError({ code: "NOT_FOUND" })

      // authorisations par type OK (procédure couvre les 2 permissions)
      assert(isDraft(current), "Delete only allowed on DRAFT contracts", "FORBIDDEN")

      await ctx.prisma.contract.delete({ where: { id: input.id } })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: current.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // -------------------------------------------------------
  // GET MY CONTRACTS (OWN by participant)
  // -------------------------------------------------------
  getMyContracts: tenantProcedure
    .use(hasPermission(P.CONTRACT.READ_OWN))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      return ctx.prisma.contract.findMany({
        where: {
          tenantId: ctx.tenantId,
          participants: { some: { userId, isActive: true } },
        },
        include: {
          participants: {
            include: {
              user: true,
              company: true,
            }
          },
          company: true,
          invoices: true,
          parent: { select: { id: true, title: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // PARTICIPANTS (GLOBAL)
  // -------------------------------------------------------
  addParticipant: tenantProcedure
    .use(hasPermission(P.CONTRACT.PARTICIPANT_GLOBAL))
    .input(z.object({
      contractId: z.string(),
      participant: participantInputSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { contractId, participant } = input

      await ctx.prisma.contractParticipant.create({
        data: {
          contractId,
          userId: participant.userId,
          role: participant.role,
          requiresSignature: participant.role === "approver" ? false : (participant.requiresSignature ?? false), // 🔥 Approvers ne peuvent JAMAIS avoir requiresSignature
          approved: false, // 🔥 Initialisé à false, passera à true quand l'approver approuve
          isPrimary: participant.isPrimary ?? false,
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contractId,
        entityName: `Participant added`,
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  removeParticipant: tenantProcedure
    .use(hasPermission(P.CONTRACT.PARTICIPANT_GLOBAL))
    .input(z.object({ contractId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.contractParticipant.deleteMany({
        where: { contractId: input.contractId, userId: input.userId },
      })
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.contractId,
        entityName: `Participant removed`,
        tenantId: ctx.tenantId,
      })
      return { success: true }
    }),

  // -------------------------------------------------------
  // ACTIONS MÉTIER
  // -------------------------------------------------------
  // 1) SEND (GLOBAL) → passe en pending_* et émet notifs
  sendForSignature: tenantProcedure
    .use(hasPermission(P.CONTRACT.SEND_GLOBAL))
    .input(z.object({ id: z.string(), target: z.enum(["agency", "contractor"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!current) throw new TRPCError({ code: "NOT_FOUND" })
      assert(current.status === "draft", "Only draft contracts can be sent")

      const workflowStatus =
        input.target === "agency" ? "pending_agency_sign" : "pending_contractor_sign"

      const updated = await ctx.prisma.contract.update({
        where: { id: input.id },
        data: { workflowStatus },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.SEND,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: current.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // 2) SIGN (OWN) → le signataire signe son propre contrat
  signOwn: tenantProcedure
    .use(hasPermission(P.CONTRACT.SIGN_OWN))
    .input(z.object({ id: z.string(), signatureUrl: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      await ensureIsParticipantActive(ctx, input.id, userId)

      const updated = await ctx.prisma.contract.update({
        where: { id: input.id },
        data: { signedAt: new Date() }, // simple marqueur; ta vraie logique de signature peut être plus fine
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.SIGN,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: updated.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // 3) APPROVE (GLOBAL) → active le contrat
  approve: tenantProcedure
    .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!current) throw new TRPCError({ code: "NOT_FOUND" })

      const updated = await ctx.prisma.contract.update({
        where: { id: input.id },
        data: { status: "active", workflowStatus: "active" },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.APPROVE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: updated.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // 4) CANCEL/TERMINATE (GLOBAL)
  cancel: tenantProcedure
    .use(hasPermission(P.CONTRACT.CANCEL_GLOBAL))
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.contract.update({
        where: { id: input.id, tenantId: ctx.tenantId },
        data: {
          status: "cancelled",
          workflowStatus: "cancelled",
          terminatedAt: new Date(),
          terminationReason: input.reason ?? "Cancelled",
          terminatedBy: ctx.session.user.id,
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.CANCEL,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: updated.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // 5) EXPORT (GLOBAL)
  export: tenantProcedure
    .use(hasPermission(P.CONTRACT.EXPORT_GLOBAL))
    .input(z.object({ type: z.enum(["msa", "sow", "all"]).default("all") }))
    .mutation(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId }
      if (input.type !== "all") where.type = input.type
      const rows = await ctx.prisma.contract.findMany({
        where,
        select: {
          id: true, type: true, title: true, status: true, workflowStatus: true,
          startDate: true, endDate: true, companyId: true, contractReference: true,
        },
        orderBy: { createdAt: "desc" },
      })
      // à brancher sur ton générateur CSV/Excel/PDF
      return { count: rows.length, rows }
    }),

  // -------------------------------------------------------
  // STATS (GLOBAL)
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.LIST_GLOBAL, P.MSA.LIST_GLOBAL]))
    .query(async ({ ctx }) => {
      const where = { tenantId: ctx.tenantId }
      return {
        total: await ctx.prisma.contract.count({ where }),
        active: await ctx.prisma.contract.count({ where: { ...where, status: "active" } }),
        draft: await ctx.prisma.contract.count({ where: { ...where, status: "draft" } }),
        completed: await ctx.prisma.contract.count({ where: { ...where, status: "completed" } }),
        msa: await ctx.prisma.contract.count({ where: { ...where, type: "msa" } }),
        sow: await ctx.prisma.contract.count({ where: { ...where, type: "sow" } }),
      }
    }),

  // -------------------------------------------------------
  // NEW WORKFLOW MUTATIONS
  // -------------------------------------------------------

  // 1) Upload Main Document → Changes status to PENDING_APPROVAL
  uploadMainDocument: tenantProcedure
    .use(hasAnyPermission([P.CONTRACT.UPDATE_GLOBAL, P.CONTRACT.UPDATE_OWN]))
    .input(z.object({ 
      contractId: z.string(),
      documentId: z.string(), // ID du document uploadé
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
      })
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })
      
      // Only DRAFT contracts can transition to PENDING_APPROVAL
      if (contract.status !== "draft") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Only draft contracts can have main document uploaded" 
        })
      }

      const updated = await ctx.prisma.contract.update({
        where: { id: input.contractId },
        data: { 
          status: "pending_approval" as any,
          workflowStatus: "pending_approval" as any,
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.contractId,
        entityName: contract.title ?? `Contract-${input.contractId.slice(0, 6)}`,
        tenantId: ctx.tenantId,
        metadata: { action: "main_document_uploaded", documentId: input.documentId }
      })

      return updated
    }),

  // 2) Approve Contract by Approver
  approveByApprover: tenantProcedure
    .input(z.object({ 
      contractId: z.string(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      
      // Check if user is an approver for this contract
      const participant = await ctx.prisma.contractParticipant.findFirst({
        where: {
          contractId: input.contractId,
          userId: userId,
          role: "approver",
          isActive: true,
        },
      })

      if (!participant) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "You are not an approver for this contract" 
        })
      }

      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
        include: {
          participants: {
            where: { role: "approver", isActive: true }
          }
        }
      })

      if (!contract) throw new TRPCError({ code: "NOT_FOUND" })

      // 🔥 Mark participant as approved (using 'approved' field, NOT 'signedAt')
      await ctx.prisma.contractParticipant.update({
        where: { id: participant.id },
        data: { approved: true },
      })

      // Check if all approvers have approved
      const allApprovers = contract.participants.filter(p => p.role === "approver")
      const approvedCount = allApprovers.filter(p => p.approved).length + 1 // +1 for current approval

      let newStatus = contract.status
      let newWorkflowStatus = contract.workflowStatus

      // If all approvers have approved, move to next stage (pending signatures)
      if (approvedCount >= allApprovers.length) {
        newStatus = "pending_signature" as any
        newWorkflowStatus = "pending_signature" as any
      }

      const updated = await ctx.prisma.contract.update({
        where: { id: input.contractId },
        data: { 
          status: newStatus,
          workflowStatus: newWorkflowStatus,
        },
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.APPROVE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.contractId,
        entityName: contract.title ?? `Contract-${input.contractId.slice(0, 6)}`,
        tenantId: ctx.tenantId,
        metadata: { comments: input.comments }
      })

      return updated
    }),

  // 3) Upload Signed Contract by Participant
  uploadSignedContract: tenantProcedure
    .input(z.object({ 
      contractId: z.string(),
      documentId: z.string(), // ID du document uploadé
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      
      // Find participant record
      const participant = await ctx.prisma.contractParticipant.findFirst({
        where: {
          contractId: input.contractId,
          userId: userId,
          requiresSignature: true,
          isActive: true,
        },
      })

      if (!participant) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "You are not required to sign this contract" 
        })
      }

      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
        include: {
          participants: {
            where: { requiresSignature: true, isActive: true }
          }
        }
      })

      if (!contract) throw new TRPCError({ code: "NOT_FOUND" })

      // Mark participant as signed
      await ctx.prisma.contractParticipant.update({
        where: { id: participant.id },
        data: { 
          signedAt: new Date(),
          signatureUrl: `/documents/${input.documentId}`, // Store reference to signed document
        },
      })

      // Check if all required signatures are collected
      const allSigners = contract.participants.filter(p => p.requiresSignature)
      const signedCount = allSigners.filter(p => p.signedAt).length + 1 // +1 for current signature

      let newStatus = contract.status
      let newWorkflowStatus = contract.workflowStatus

      // If all signatures collected, move to COMPLETED
      if (signedCount >= allSigners.length) {
        newStatus = "completed"
        newWorkflowStatus = "completed"
      }

      const updated = await ctx.prisma.contract.update({
        where: { id: input.contractId },
        data: { 
          status: newStatus,
          workflowStatus: newWorkflowStatus,
        },
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.SIGN,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.contractId,
        entityName: contract.title ?? `Contract-${input.contractId.slice(0, 6)}`,
        tenantId: ctx.tenantId,
        metadata: { documentId: input.documentId }
      })

      return updated
    }),

  // 4) Activate Contract (Admin only) → COMPLETED → ACTIVE
  activateContract: tenantProcedure
    .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" })
      
      if (contract.status !== "completed") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Only completed contracts can be activated" 
        })
      }

      const updated = await ctx.prisma.contract.update({
        where: { id: input.id },
        data: { 
          status: "active",
          workflowStatus: "active",
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.APPROVE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: contract.title ?? `Contract-${input.id.slice(0, 6)}`,
        tenantId: ctx.tenantId,
        metadata: { action: "contract_activated" }
      })

      return updated
    }),

  // 5) Check User Actions Required (for notification indicator)
  getUserActionsRequired: tenantProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      
      // Find contracts where user needs to take action
      const participants = await ctx.prisma.contractParticipant.findMany({
        where: {
          userId: userId,
          isActive: true,
          signedAt: null, // Not yet signed/approved
        },
        include: {
          contract: {
            select: {
              id: true,
              status: true,
              workflowStatus: true,
              title: true,
            }
          }
        }
      })

      const approverActions = participants.filter(
        p => p.role === "approver" && 
        (p.contract.status === "pending_approval" || p.contract.workflowStatus === "pending_approval")
      )

      const signatureActions = participants.filter(
        p => p.requiresSignature && 
        (p.contract.status === "pending_signature" || p.contract.workflowStatus === "pending_signature")
      )

      return {
        hasActions: approverActions.length > 0 || signatureActions.length > 0,
        approverCount: approverActions.length,
        signatureCount: signatureActions.length,
        total: approverActions.length + signatureActions.length,
      }
    }),
})
