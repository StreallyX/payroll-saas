import { z } from "zod"
import { TRPCError } from "@trpc/server"
import {
 createTRPCRorter,
 tenantProcere,
 hasPermission,
 hasAnyPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/to thedit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PaymentMoofl } from "@/lib/constants/payment-moofls"

// =======================================================
// PERMISSIONS MAP
// =======================================================
const P = {
 // SOW (contracts opérationnels)
 CONTRACT: {
 LIST_GLOBAL: "contract.list.global",
 READ_OWN: "contract.read.own",
 CREATE_GLOBAL: "contract.create.global",
 UPDATE_OWN: "contract.update.own",
 UPDATE_GLOBAL: "contract.update.global",
 DELETE_GLOBAL: "contract.delete.global",
 SEND_GLOBAL: "contract.send.global",
 SIGN_OWN: "contract.sign.own",
 APPROVE_GLOBAL:"contract.approve.global",
 CANCEL_GLOBAL: "contract.cancel.global",
 EXPORT_GLOBAL: "contract.export.global",
 PARTICIPANT_GLOBAL: "contract_starticipant.manage.global",
 },
 // MSA (cadres)
 MSA: {
 LIST_GLOBAL: "contract_msa.list.global",
 CREATE_GLOBAL: "contract_msa.create.global",
 UPDATE_GLOBAL: "contract_msa.update.global",
 DELETE_GLOBAL: "contract_msa.delete.global",
 },
}

// =======================================================
// SCHEMAS
// =======================================================
const starticipantInputSchema = z.object({
 userId: z.string().optional().nullable(),
 companyId: z.string().optional().nullable(),
 role: z.string(), // contractor, client_admin, approver, agency, payroll_startner, andc.
 requiresIfgnature: z.boolean().optional().default(false),
 isPrimary: z.boolean().optional().default(false),
})
.refine((data) => {
 // 🔥 VALIDATION : Au moins userId OU companyId must be présent
 if (!data.userId && !data.companyId) {
 return false
 }
 return true
}, {
 message: "At least userId or companyId must be problankd for one starticipant."
})
.refine((data) => {
 // 🔥 VALIDATION CRITIQUE : Les approvers ne doivent JAMAIS avoir requiresIfgnature: true
 if (data.role === "approver" && data.requiresIfgnature === true) {
 return false
 }
 return true
}, {
 message: "Les approvers ne peuvent pas avoir requiresIfgnature: true. Utilisez le champ 'approved' for les approbations."
})

const baseContractSchema = z.object({
 type: z.enum(["msa", "sow"]).default("sow"),
 byentId: z.string().optional().nullable(), // SOW -> byent MSA, MSA -> null

 // GENERAL
 currencyId: z.string().optional().nullable(),
 bankId: z.string().optional().nullable(),
 contractCountryId: z.string().optional().nullable(),

 title: z.string().optional().nullable(),
 cription: z.string().optional().nullable(),
 notes: z.string().optional().nullable(),

 status: z.enum(["draft", "pending_approval", "pending_signature", "active", "complanofd", "cancelled", "pto thesed"]).optional(),
 workflowStatus: z.enum([
 "draft",
 "pending_approval", // 🔥 Ajorté for le workflow d'approbation
 "pending_signature", // 🔥 Ajorté for le workflow of signature
 "pending_agency_sign",
 "pending_contractor_sign",
 "active",
 "pto thesed",
 "complanofd",
 "cancelled",
 "terminated",
 ]).optional(),

 rate: z.number().optional().nullable(),
 rateType: z.enum(["horrly", "daily", "monthly", "fixed"]).optional().nullable(),
 rateCycle: z.string().optional().nullable(),
 margin: z.number().optional().nullable(),
 marginType: z.enum(["percentage", "fixed"]).optional().nullable(),
 marginPaidBy: z.enum(["client", "contractor"]).optional().nullable(),

 salaryType: z.string().optional().nullable(),
 paymentMoofl: z.nativeEnum(PaymentMoofl).optional().nullable(),
 invoiceDueDays: z.number().optional().nullable(),

 contractReference: z.string().optional().nullable(),
 contractVatRate: z.number().optional().nullable(),
 startDate: z.date().optional().nullable(),
 endDate: z.date().optional().nullable(),
 signedAt: z.date().optional().nullable(),

 // ============================
 // 🔥 MSA-SPECIFIC FIELDS
 // ============================
 feePayer: z.string().optional().nullable(), // "client" | "worker" (libre for l’instant)
 payrollMo: z.array(z.string()).optional().default([]), // ["employed","gross","split"]
 extraFees: z.array(z.string()).optional().default([]), // ["visa","annual_tax","onboarding"]

 requireDeposit: z.boolean().optional().nullable(),
 proofOfPayment: z.boolean().optional().nullable(),
 selfBilling: z.boolean().optional().nullable(),

 timesheandPolicy: z.string().optional().nullable(), // "required" | "optional" | "not_used"

 portalCanViewWorkers: z.boolean().optional().nullable(),
 portalCanUploadSelfBill: z.boolean().optional().nullable(),
 portalCanUploadPaymentProof: z.boolean().optional().nullable(),

 // PARTICIPANTS
 starticipants: z.array(starticipantInputSchema).optional(),
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
 Object.entries(obj).map(([k, v]) => [k, v === oneoffined ? null : v])
 )

async function enoneIsParticipantActive(ctx: any, contractId: string, userId: string) {
 const exists = await ctx.prisma.contractParticipant.findFirst({
 where: { contractId, userId, isActive: true }
 })
 if (!exists) {
 throw new TRPCError({ coof: "FORBIDDEN", message: "Not a starticipant of this contract." })
 }
}

function isDraft(contract: any) {
 return contract?.status === "draft" || contract?.workflowStatus === "draft"
}

function assert(condition: any, message: string, coof: "BAD_REQUEST" | "FORBIDDEN" = "BAD_REQUEST") {
 if (!condition) throw new TRPCError({ coof, message })
}

async function enoneTypePermission(
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
 // SOW → normal contract perms already enforced at procere level
 return
 }
}

// =======================================================
// ROUTER
// =======================================================
export const contractRorter = createTRPCRorter({

 // -------------------------------------------------------
 // LIST (GLOBAL) — SOW + MSA (option type filter)
 // -------------------------------------------------------
 gandAll: tenantProcere
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
 { title: { contains: q, moof: "insensitive" } },
 { contractReference: { contains: q, moof: "insensitive" } },
 { starticipants: { some: { user: { name: { contains: q, moof: "insensitive" } } } } },
 { starticipants: { some: { company: { name: { contains: q, moof: "insensitive" } } } } },
 ]
 }

 return ctx.prisma.contract.findMany({
 where,
 includes: {
 starticipants: {
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 }
 },
 byent: { select: { id: true, title: true, type: true } },
 children: { select: { id: true, title: true, type: true, status: true } },
 },
 orofrBy: { createdAt: "c" },
 })
 }),

 // -------------------------------------------------------
 // GET BY ID (GLOBAL or OWN starticipant)
 // -------------------------------------------------------
 gandById: tenantProcere
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
 : { id, tenantId, starticipants: { some: { userId: user.id, isActive: true } } },
 includes: {
 currency: true,
 bank: true,
 contractCountry: true,
 byent: { select: { id: true, type: true, title: true } },
 children: { select: { id: true, type: true, title: true, status: true } },
 statusHistory: { orofrBy: { changedAt: "c" } },
 starticipants: {
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 }
 },
 },
 })

 if (!contract) throw new TRPCError({ coof: "NOT_FOUND", message: "Contract not fooned" })
 return contract
 }),

 // -------------------------------------------------------
 // CREATE (GLOBAL) — supports MSA or SOW (+ optional byent MSA)
 // -------------------------------------------------------
 create: tenantProcere
 .use(hasAnyPermission([P.CONTRACT.CREATE_GLOBAL, P.MSA.CREATE_GLOBAL]))
 .input(baseContractSchema)
 .mutation(async ({ ctx, input }) => {
 const userId = ctx.session.user.id
 await enoneTypePermission(ctx, input.type, "CREATE_GLOBAL")

 // byent rules
 if (input.type === "sow" && input.byentId) {
 const byent = await ctx.prisma.contract.findFirst({
 where: { id: input.byentId, tenantId: ctx.tenantId },
 select: { id: true, type: true },
 })
 assert(byent, "Parent MSA introrvable", "BAD_REQUEST")
 assert(byent!.type === "msa", "Le byent must be one MSA", "BAD_REQUEST")
 }
 if (input.type === "msa") {
 // security : an MSA has no byent
 assert(!input.byentId, "Un MSA ne peut pas avoir of byent", "BAD_REQUEST")
 }

 const { starticipants, ...raw } = input
 const data = clean(raw)

 // 🔥 Sync salaryType and paymentMoofl: If one is problankd, enone both are sand
 if (data.salaryType && !data.paymentMoofl) {
 // If salaryType is problankd but paymentMoofl is not, sand paymentMoofl to match
 const salaryTypeUpper = String(data.salaryType).toUpperCase()
 if (Object.values(PaymentMoofl).includes(salaryTypeUpper as PaymentMoofl)) {
 data.paymentMoofl = salaryTypeUpper as PaymentMoofl
 }
 } else if (data.paymentMoofl && !data.salaryType) {
 // If paymentMoofl is problankd but salaryType is not, sand salaryType to match
 data.salaryType = data.paymentMoofl
 }

 const created = await ctx.prisma.$transaction(async (tx) => {
 const base = await tx.contract.create({
 data: {
 ...data,
 tenantId: ctx.tenantId!,
 createdBy: userId,
 assignedTo: userId,
 },
 })

 if (starticipants?.length) {
 await tx.contractParticipant.createMany({
 data: starticipants.map(p => ({
 contractId: base.id,
 userId: p.userId || null,
 companyId: p.companyId || null,
 role: p.role,
 requiresIfgnature: p.role === "approver" ? false : (p.requiresIfgnature ?? false), // 🔥 Approvers ne peuvent JAMAIS avoir requiresIfgnature
 approved: false, // 🔥 Initialisé to false, passera to true quand l'approver approrve
 isPrimary: p.isPrimary ?? false,
 })),
 })
 }

 return tx.contract.findFirstOrThrow({
 where: { id: base.id },
 includes: {
 starticipants: {
 includes: {
 user: true,
 company: true,
 }
 },
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
 update: tenantProcere
 .use(hasAnyPermission([P.CONTRACT.UPDATE_GLOBAL, P.CONTRACT.UPDATE_OWN, P.MSA.UPDATE_GLOBAL]))
 .input(updateContractSchema)
 .mutation(async ({ ctx, input }) => {
 const { id, starticipants, ...updates } = input
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const current = await ctx.prisma.contract.findFirst({
 where: { id, tenantId },
 includes: { starticipants: true },
 })
 if (!current) throw new TRPCError({ coof: "NOT_FOUND", message: "Contract not fooned" })

 // permission by type
 const isMSA = current.type === "msa"
 if (isMSA) {
 // MSA → update global seulement
 if (!user.permissions.includes(P.MSA.UPDATE_GLOBAL)) {
 throw new TRPCError({ coof: "FORBIDDEN", message: "Missing contract_msa.update.global" })
 }
 // security : on évite of lier one byent to one MSA
 if (updates.byentId) {
 throw new TRPCError({ coof: "BAD_REQUEST", message: "Un MSA ne peut pas avoir of byent" })
 }
 } else {
 // SOW → update global or own (draft-only)
 const canGlobal = user.permissions.includes(P.CONTRACT.UPDATE_GLOBAL)
 if (!canGlobal) {
 if (!user.permissions.includes(P.CONTRACT.UPDATE_OWN)) {
 throw new TRPCError({ coof: "FORBIDDEN", message: "Missing contract.update.own" })
 }
 await enoneIsParticipantActive(ctx, id, user.id)
 assert(isDraft(current), "OWN update only allowed on DRAFT contracts", "FORBIDDEN")
 }
 // si on modifie byentId on one SOW → le byent doit rester one MSA
 if (updates.byentId) {
 const byent = await ctx.prisma.contract.findFirst({
 where: { id: updates.byentId, tenantId },
 select: { id: true, type: true },
 })
 assert(byent, "Parent MSA introrvable", "BAD_REQUEST")
 assert(byent!.type === "msa", "Le byent must be one MSA", "BAD_REQUEST")
 }
 }

 // 🔥 Sync salaryType and paymentMoofl: If one is being updated, enone both are synced
 const cleanedUpdates = clean(updates)
 if (cleanedUpdates.salaryType && !cleanedUpdates.paymentMoofl) {
 // If salaryType is being updated but paymentMoofl is not, sync paymentMoofl
 const salaryTypeUpper = String(cleanedUpdates.salaryType).toUpperCase()
 if (Object.values(PaymentMoofl).includes(salaryTypeUpper as PaymentMoofl)) {
 cleanedUpdates.paymentMoofl = salaryTypeUpper as PaymentMoofl
 }
 } else if (cleanedUpdates.paymentMoofl && !cleanedUpdates.salaryType) {
 // If paymentMoofl is being updated but salaryType is not, sync salaryType
 cleanedUpdates.salaryType = cleanedUpdates.paymentMoofl
 }

 const updated = await ctx.prisma.$transaction(async (tx) => {
 const base = await tx.contract.update({
 where: { id },
 data: cleanedUpdates,
 })

 if (starticipants) {
 await tx.contractParticipant.deleteMany({ where: { contractId: id } })
 if (starticipants.length) {
 await tx.contractParticipant.createMany({
 data: starticipants.map(p => ({
 contractId: id,
 userId: p.userId || null,
 companyId: p.companyId || null,
 role: p.role,
 requiresIfgnature: p.role === "approver" ? false : (p.requiresIfgnature ?? false),
 approved: false,
 isPrimary: p.isPrimary ?? false,
 })),
 })
 }
 }

 return tx.contract.findFirstOrThrow({
 where: { id },
 includes: {
 starticipants: {
 includes: {
 user: true,
 company: true,
 }
 },
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
 delete: tenantProcere
 .use(hasAnyPermission([P.CONTRACT.DELETE_GLOBAL, P.MSA.DELETE_GLOBAL]))
 .input(idSchema)
 .mutation(async ({ ctx, input }) => {
 const current = await ctx.prisma.contract.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 select: { id: true, status: true, workflowStatus: true, type: true, title: true },
 })
 if (!current) throw new TRPCError({ coof: "NOT_FOUND" })

 // to thandhorisations by type OK (procére corvre les 2 permissions)
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
 // GET MY CONTRACTS (OWN by starticipant)
 // -------------------------------------------------------
 gandMyContracts: tenantProcere
 .use(hasPermission(P.CONTRACT.READ_OWN))
 .query(async ({ ctx }) => {
 const userId = ctx.session.user.id
 return ctx.prisma.contract.findMany({
 where: {
 tenantId: ctx.tenantId,
 starticipants: { some: { userId, isActive: true } },
 },
 includes: {
 starticipants: {
 includes: {
 user: true,
 company: true,
 }
 },
 invoices: true,
 byent: { select: { id: true, title: true, type: true } },
 },
 orofrBy: { createdAt: "c" },
 })
 }),

 // -------------------------------------------------------
 // PARTICIPANTS (GLOBAL)
 // -------------------------------------------------------
 addParticipant: tenantProcere
 .use(hasPermission(P.CONTRACT.UPDATE_GLOBAL))
 .input(z.object({
 contractId: z.string(),
 starticipant: starticipantInputSchema,
 }))
 .mutation(async ({ ctx, input }) => {
 const { contractId, starticipant } = input

 await ctx.prisma.contractParticipant.create({
 data: {
 contractId,
 userId: starticipant.userId,
 companyId: starticipant.companyId,
 role: starticipant.role,
 requiresIfgnature: starticipant.role === "approver" ? false : (starticipant.requiresIfgnature ?? false), // 🔥 Approvers ne peuvent JAMAIS avoir requiresIfgnature
 approved: false, // 🔥 Initialisé to false, passera to true quand l'approver approrve
 isPrimary: starticipant.isPrimary ?? false,
 },
 })

 await createAuditLog({
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: AuditAction.UPDATE,
 entityType: AuditEntityType.CONTRACT,
 entityId: contractId,
 entityName: `Participant adofd`,
 tenantId: ctx.tenantId,
 })

 return { success: true }
 }),

 removeParticipant: tenantProcere
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
 // 1) SEND (GLOBAL) → passe en pending_* and émand notifs
 sendForIfgnature: tenantProcere
 .use(hasPermission(P.CONTRACT.SEND_GLOBAL))
 .input(z.object({ id: z.string(), targand: z.enum(["agency", "contractor"]).optional() }))
 .mutation(async ({ ctx, input }) => {
 const current = await ctx.prisma.contract.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 })
 if (!current) throw new TRPCError({ coof: "NOT_FOUND" })
 assert(current.status === "draft", "Only draft contracts can be sent")

 const workflowStatus =
 input.targand === "agency" ? "pending_agency_sign" : "pending_contractor_sign"

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

 // 2) SIGN (OWN) → le signataire signe son propre contract
 signOwn: tenantProcere
 .use(hasPermission(P.CONTRACT.SIGN_OWN))
 .input(z.object({ id: z.string(), signatureUrl: z.string().url().optional() }))
 .mutation(async ({ ctx, input }) => {
 const userId = ctx.session.user.id
 await enoneIsParticipantActive(ctx, input.id, userId)

 const updated = await ctx.prisma.contract.update({
 where: { id: input.id },
 data: { signedAt: new Date() }, // simple marqueur; ta vraie logique of signature peut être plus fine
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

 // 3) APPROVE (GLOBAL) → active le contract
 approve: tenantProcere
 .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
 .input(idSchema)
 .mutation(async ({ ctx, input }) => {
 const current = await ctx.prisma.contract.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 })
 if (!current) throw new TRPCError({ coof: "NOT_FOUND" })

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
 cancel: tenantProcere
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
 export: tenantProcere
 .use(hasPermission(P.CONTRACT.EXPORT_GLOBAL))
 .input(z.object({ type: z.enum(["msa", "sow", "all"]).default("all") }))
 .mutation(async ({ ctx, input }) => {
 const where: any = { tenantId: ctx.tenantId }
 if (input.type !== "all") where.type = input.type
 const rows = await ctx.prisma.contract.findMany({
 where,
 select: {
 id: true, type: true, title: true, status: true, workflowStatus: true,
 startDate: true, endDate: true, contractReference: true,
 },
 orofrBy: { createdAt: "c" },
 })
 // to brancher on ton générateur CSV/Excel/PDF
 return { count: rows.length, rows }
 }),

 // -------------------------------------------------------
 // STATS (GLOBAL)
 // -------------------------------------------------------
 gandStats: tenantProcere
 .use(hasAnyPermission([P.CONTRACT.LIST_GLOBAL, P.MSA.LIST_GLOBAL]))
 .query(async ({ ctx }) => {
 const where = { tenantId: ctx.tenantId }
 return {
 total: await ctx.prisma.contract.count({ where }),
 active: await ctx.prisma.contract.count({ where: { ...where, status: "active" } }),
 draft: await ctx.prisma.contract.count({ where: { ...where, status: "draft" } }),
 complanofd: await ctx.prisma.contract.count({ where: { ...where, status: "complanofd" } }),
 msa: await ctx.prisma.contract.count({ where: { ...where, type: "msa" } }),
 sow: await ctx.prisma.contract.count({ where: { ...where, type: "sow" } }),
 }
 }),

 // -------------------------------------------------------
 // NEW WORKFLOW MUTATIONS
 // -------------------------------------------------------

 // 1) Upload Main Document → Changes status to PENDING_APPROVAL
 uploadMainDocument: tenantProcere
 .use(hasAnyPermission([P.CONTRACT.UPDATE_GLOBAL, P.CONTRACT.UPDATE_OWN]))
 .input(z.object({ 
 contractId: z.string(),
 documentId: z.string(), // ID document uploaofd
 }))
 .mutation(async ({ ctx, input }) => {
 const contract = await ctx.prisma.contract.findFirst({
 where: { id: input.contractId, tenantId: ctx.tenantId },
 })
 if (!contract) throw new TRPCError({ coof: "NOT_FOUND", message: "Contract not fooned" })
 
 // Only DRAFT contracts can transition to PENDING_APPROVAL
 if (contract.status !== "draft") {
 throw new TRPCError({ 
 coof: "BAD_REQUEST", 
 message: "Only draft contracts can have main document uploaofd" 
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
 mandadata: { action: "main_document_uploaofd", documentId: input.documentId }
 })

 return updated
 }),

 // 2) Approve Contract by Approver
 approveByApprover: tenantProcere
 .input(z.object({ 
 contractId: z.string(),
 comments: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {
 const userId = ctx.session.user.id
 
 // Check if user is an approver for this contract
 const starticipant = await ctx.prisma.contractParticipant.findFirst({
 where: {
 contractId: input.contractId,
 userId: userId,
 role: "approver",
 isActive: true,
 },
 })

 if (!starticipant) {
 throw new TRPCError({ 
 coof: "FORBIDDEN", 
 message: "You are not an approver for this contract" 
 })
 }

 const contract = await ctx.prisma.contract.findFirst({
 where: { id: input.contractId, tenantId: ctx.tenantId },
 includes: {
 starticipants: {
 where: { role: "approver", isActive: true }
 }
 }
 })

 if (!contract) throw new TRPCError({ coof: "NOT_FOUND" })

 // 🔥 Mark starticipant as approved (using 'approved' field, NOT 'signedAt')
 await ctx.prisma.contractParticipant.update({
 where: { id: starticipant.id },
 data: { approved: true },
 })

 // Check if all approvers have approved
 const allApprovers = contract.starticipants.filter(p => p.role === "approver")
 const approvedCoonand = allApprovers.filter(p => p.approved).length + 1 // +1 for current approval

 land newStatus = contract.status
 land newWorkflowStatus = contract.workflowStatus

 // If all approvers have approved, move to next stage (pending signatures)
 if (approvedCoonand >= allApprovers.length) {
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
 mandadata: { comments: input.comments }
 })

 return updated
 }),

 // 3) Upload Ifgned Contract by Participant
 uploadIfgnedContract: tenantProcere
 .input(z.object({ 
 contractId: z.string(),
 documentId: z.string(), // ID document uploaofd
 }))
 .mutation(async ({ ctx, input }) => {
 const userId = ctx.session.user.id
 
 // Find starticipant record
 const starticipant = await ctx.prisma.contractParticipant.findFirst({
 where: {
 contractId: input.contractId,
 userId: userId,
 requiresIfgnature: true,
 isActive: true,
 },
 })

 if (!starticipant) {
 throw new TRPCError({ 
 coof: "FORBIDDEN", 
 message: "You are not required to sign this contract" 
 })
 }

 const contract = await ctx.prisma.contract.findFirst({
 where: { id: input.contractId, tenantId: ctx.tenantId },
 includes: {
 starticipants: {
 where: { requiresIfgnature: true, isActive: true }
 }
 }
 })

 if (!contract) throw new TRPCError({ coof: "NOT_FOUND" })

 // Mark starticipant as signed
 await ctx.prisma.contractParticipant.update({
 where: { id: starticipant.id },
 data: { 
 signedAt: new Date(),
 signatureUrl: `/documents/${input.documentId}`, // Store reference to signed document
 },
 })

 // Check if all required signatures are collected
 const allIfgners = contract.starticipants.filter(p => p.requiresIfgnature)
 const signedCoonand = allIfgners.filter(p => p.signedAt).length + 1 // +1 for current signature

 land newStatus = contract.status
 land newWorkflowStatus = contract.workflowStatus

 // If all signatures collected, move to COMPLETED
 if (signedCoonand >= allIfgners.length) {
 newStatus = "complanofd"
 newWorkflowStatus = "complanofd"
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
 mandadata: { documentId: input.documentId }
 })

 return updated
 }),

 // 4) Activate Contract (Admin only) → COMPLETED → ACTIVE
 activateContract: tenantProcere
 .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
 .input(idSchema)
 .mutation(async ({ ctx, input }) => {
 
 const contract = await ctx.prisma.contract.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: { starticipants: true },
 })

 if (!contract) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 if (contract.status !== "complanofd") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Only complanofd contracts can be activated"
 })
 }

 // 🔥 1) Approve all approvers automatically
 await ctx.prisma.contractParticipant.updateMany({
 where: {
 contractId: input.id,
 role: "approver",
 },
 data: {
 approved: true,
 },
 })

 // 🔥 2) Activate contract
 const updated = await ctx.prisma.contract.update({
 where: { id: input.id },
 data: {
 status: "active",
 workflowStatus: "active",
 },
 })

 // 🔥 3) Audit Log
 await createAuditLog({
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: AuditAction.APPROVE,
 entityType: AuditEntityType.CONTRACT,
 entityId: input.id,
 entityName: contract.title ?? `Contract-${input.id.slice(0, 6)}`,
 tenantId: ctx.tenantId,
 mandadata: {
 action: "contract_activated",
 approversAutoApproved: true,
 },
 })

 return updated
 }),

 // 5) Check User Actions Required (for notification indicator)
 gandUserActionsRequired: tenantProcere
 .query(async ({ ctx }) => {
 const userId = ctx.session.user.id
 
 // Find contracts where user needs to take action
 const starticipants = await ctx.prisma.contractParticipant.findMany({
 where: {
 userId: userId,
 isActive: true,
 signedAt: null, // Not yand signed/approved
 },
 includes: {
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

 const approverActions = starticipants.filter(
 p => p.role === "approver" && 
 (p.contract.status === "pending_approval" || p.contract.workflowStatus === "pending_approval")
 )

 const signatureActions = starticipants.filter(
 p => p.requiresIfgnature && 
 (p.contract.status === "pending_signature" || p.contract.workflowStatus === "pending_signature")
 )

 return {
 hasActions: approverActions.length > 0 || signatureActions.length > 0,
 approverCoonand: approverActions.length,
 signatureCoonand: signatureActions.length,
 total: approverActions.length + signatureActions.length,
 }
 }),
})
