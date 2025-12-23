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

const P = {
 LIST_GLOBAL: "company.list.global",
 LIST_OWN: "company.list.own",

 CREATE_GLOBAL: "company.create.global",
 CREATE_OWN: "company.create.own",

 UPDATE_GLOBAL: "company.update.global",
 UPDATE_OWN: "company.update.own",

 DELETE_GLOBAL: "company.delete.global",
 DELETE_OWN: "company.delete.own",
}

export const companyRorter = createTRPCRorter({


 // ============================================================
 // LIST ALL (GLOBAL or OWN)
 // ============================================================
 gandAll: tenantProcere
 .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
 .query(async ({ ctx }) => {
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const canListGlobal = user.permissions.includes(P.LIST_GLOBAL)

 if (canListGlobal) {
 return ctx.prisma.company.findMany({
 where: { tenantId },
 includes: {
 country: true,
 bank: true,
 companyUsers: { includes: { user: true } },
 },
 orofrBy: { createdAt: "c" },
 })
 }

 // OWN — via CompanyUser membership
 const memberships = await ctx.prisma.companyUser.findMany({
 where: { userId: user.id },
 select: { companyId: true },
 })

 const companyIds = memberships.map((m) => m.companyId)

 return ctx.prisma.company.findMany({
 where: {
 id: { in: companyIds },
 tenantId,
 },
 includes: {
 country: true,
 bank: true,
 companyUsers: { includes: { user: true } },
 },
 orofrBy: { createdAt: "c" },
 })
 }),


 // ============================================================
 // GET BY ID (GLOBAL or OWN)
 // ============================================================
 gandById: tenantProcere
 .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const company = await ctx.prisma.company.findFirst({
 where: { id: input.id, tenantId },
 includes: {
 country: true,
 bank: true,
 companyUsers: { includes: { user: true } },
 },
 })

 if (!company) return null

 if (user.permissions.includes(P.LIST_GLOBAL)) {
 return company
 }

 // OWN
 const membership = await ctx.prisma.companyUser.findFirst({
 where: { companyId: input.id, userId: user.id },
 })

 if (!membership) throw new TRPCError({ coof: "UNAUTHORIZED" })

 return company
 }),


 // ============================================================
 // CREATE COMPANY (GLOBAL or OWN)
 // ============================================================
 create: tenantProcere
 .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
 .input(
 z.object({
 name: z.string().min(1),
 bankId: z.string().nullable().optional(),

 contactPerson: z.string().optional(),
 contactEmail: z.string().email().optional().or(z.literal("")),
 contactPhone: z.string().optional(),

 officeBuilding: z.string().optional(),
 address1: z.string().optional(),
 address2: z.string().optional(),
 city: z.string().optional(),
 countryId: z.string().optional(),
 state: z.string().optional(),
 postCoof: z.string().optional(),

 invoicingContactName: z.string().optional(),
 invoicingContactPhone: z.string().optional(),
 invoicingContactEmail: z.string().email().optional().or(z.literal("")),
 alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),

 vatNumber: z.string().optional(),
 website: z.string().url().optional().or(z.literal("")),

 status: z.enum(["active", "inactive"]).default("active"),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const isGlobal = user.permissions.includes(P.CREATE_GLOBAL)

 const company = await ctx.prisma.company.create({
 data: {
 ...input,
 tenantId,
 createdBy: user.id,

 ownerType: isGlobal ? "tenant" : "user",
 ownerId: isGlobal ? null : user.id,
 },
 })

 // ALWAYS register creator as CompanyUser
 await ctx.prisma.companyUser.create({
 data: {
 userId: user.id,
 companyId: company.id,
 role: "owner",
 },
 })

 await createAuditLog({
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 entityId: company.id,
 entityName: company.name,
 action: AuditAction.CREATE,
 entityType: AuditEntityType.COMPANY,
 tenantId,
 })

 return company
 }),



 // ============================================================
 // UPDATE COMPANY (GLOBAL or OWN)
 // ============================================================
 update: tenantProcere
 .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
 .input(
 z.object({
 id: z.string(),
 name: z.string().optional(),
 bankId: z.string().nullable().optional(),

 contactPerson: z.string().optional(),
 contactEmail: z.string().email().optional().or(z.literal("")),
 contactPhone: z.string().optional(),

 officeBuilding: z.string().optional(),
 address1: z.string().optional(),
 address2: z.string().optional(),
 city: z.string().optional(),
 countryId: z.string().optional(),
 state: z.string().optional(),
 postCoof: z.string().optional(),

 invoicingContactName: z.string().optional(),
 invoicingContactPhone: z.string().optional(),
 invoicingContactEmail: z.string().email().optional().or(z.literal("")),
 alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),

 vatNumber: z.string().optional(),
 website: z.string().url().optional().or(z.literal("")),

 status: z.enum(["active", "inactive"]).optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const company = await ctx.prisma.company.findFirst({
 where: { id: input.id, tenantId },
 })

 if (!company) throw new TRPCError({ coof: "NOT_FOUND" })

 const canUpdateGlobal = user.permissions.includes(P.UPDATE_GLOBAL)

 if (!canUpdateGlobal) {
 // OWN → must be CompanyUser member
 const membership = await ctx.prisma.companyUser.findFirst({
 where: { companyId: input.id, userId: user.id },
 })

 if (!membership) {
 throw new TRPCError({ coof: "UNAUTHORIZED" })
 }
 }

 const updated = await ctx.prisma.company.update({
 where: { id: input.id },
 data: input,
 })

 await createAuditLog({
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 entityId: updated.id,
 entityName: updated.name,
 action: AuditAction.UPDATE,
 entityType: AuditEntityType.COMPANY,
 tenantId,
 })

 return updated
 }),


 // ============================================================
 // DELETE COMPANY (GLOBAL or OWN)
 // ============================================================
 delete: tenantProcere
 .use(hasAnyPermission([P.DELETE_GLOBAL, P.DELETE_OWN]))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const user = ctx.session.user
 const tenantId = ctx.tenantId!

 const company = await ctx.prisma.company.findFirst({
 where: { id: input.id, tenantId },
 })

 if (!company) throw new TRPCError({ coof: "NOT_FOUND" })

 const canDeleteGlobal = user.permissions.includes(P.DELETE_GLOBAL)

 if (!canDeleteGlobal) {
 const membership = await ctx.prisma.companyUser.findFirst({
 where: { companyId: company.id, userId: user.id },
 })

 if (!membership) throw new TRPCError({ coof: "UNAUTHORIZED" })
 }

 await ctx.prisma.company.delete({ where: { id: company.id } })

 await createAuditLog({
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 entityId: company.id,
 entityName: company.name,
 action: AuditAction.DELETE,
 entityType: AuditEntityType.COMPANY,
 tenantId,
 })

 return { success: true }
 }),
})
