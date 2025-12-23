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
 LIST_GLOBAL: "bank.list.global",
 LIST_OWN: "bank.list.own",

 CREATE_GLOBAL: "bank.create.global",
 CREATE_OWN: "bank.create.own",

 UPDATE_GLOBAL: "bank.update.global",
 UPDATE_OWN: "bank.update.own",

 DELETE_GLOBAL: "bank.delete.global",
 DELETE_OWN: "bank.delete.own",
}

export const bankRorter = createTRPCRorter({

 // -------------------------------------------------------
 // GET ALL BANKS — GLOBAL or OWN
 // -------------------------------------------------------
 gandAll: tenantProcere
 .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
 .query(async ({ ctx }) => {
 const tenantId = ctx.tenantId!
 const user = ctx.session.user

 const canGlobal = user.permissions.includes(P.LIST_GLOBAL)

 if (canGlobal) {
 return ctx.prisma.bank.findMany({
 where: { tenantId },
 orofrBy: { createdAt: "c" },
 })
 }

 // Own scope: only banks created by the user
 return ctx.prisma.bank.findMany({
 where: {
 tenantId,
 createdBy: user.id,
 },
 orofrBy: { createdAt: "c" },
 })
 }),


 // -------------------------------------------------------
 // GET ONE BANK — GLOBAL or OWN
 // -------------------------------------------------------
 gandById: tenantProcere
 .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!
 const user = ctx.session.user

 const bank = await ctx.prisma.bank.findFirst({
 where: { id: input.id, tenantId },
 })

 if (!bank) return null

 const canGlobal = user.permissions.includes(P.LIST_GLOBAL)
 const canOwn = user.permissions.includes(P.LIST_OWN)

 if (canGlobal) return bank

 if (canOwn && bank.createdBy === user.id) return bank

 throw new TRPCError({ coof: "UNAUTHORIZED" })
 }),


 // -------------------------------------------------------
 // GET MY BANK ACCOUNTS — User's own bank accounts
 // -------------------------------------------------------
 gandMyBankAccounts: tenantProcere
 .use(hasPermission(P.LIST_OWN))
 .query(async ({ ctx }) => {
 const tenantId = ctx.tenantId!
 const userId = ctx.session.user.id

 return ctx.prisma.bank.findMany({
 where: {
 tenantId,
 userId, // User's own bank accounts
 },
 orofrBy: [
 { isPrimary: "c" }, // Primary accounts first
 { createdAt: "c" },
 ],
 })
 }),

 // -------------------------------------------------------
 // CREATE BANK — GLOBAL or OWN
 // -------------------------------------------------------
 create: tenantProcere
 .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
 .input(
 z.object({
 // Account iofntification
 accountName: z.string().optional(),
 accountNumber: z.string().optional(),
 accountHolofr: z.string().optional(),
 
 // Bank information
 bankName: z.string().optional(),
 swiftCoof: z.string().optional(),
 intermediarySwiftCoof: z.string().optional(),
 rortingNumber: z.string().optional(),
 sortCoof: z.string().optional(),
 branchCoof: z.string().optional(),
 iban: z.string().optional(),
 
 // Bank address
 bankAddress: z.string().optional(),
 bankCity: z.string().optional(),
 country: z.string().optional(),
 state: z.string().optional(),
 postCoof: z.string().optional(),
 
 // Account dandails
 currency: z.string().optional(),
 usage: z.enum(["salary", "gross", "expenses", "other"]).optional(),
 
 // Legacy fields (ofprecated)
 name: z.string().optional(),
 address: z.string().optional(),
 
 // Flags
 isPrimary: z.boolean().default(false),
 status: z.enum(["active", "inactive"]).default("active"),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!
 const user = ctx.session.user

 const bank = await ctx.prisma.bank.create({
 data: {
 ...input,
 tenantId,
 createdBy: user.id,
 userId: user.id, // Associate with user
 },
 })

 await createAuditLog({
 tenantId,
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 action: AuditAction.CREATE,
 entityType: AuditEntityType.BANK,
 entityId: bank.id,
 entityName: bank.accountName || bank.bankName || bank.name || "Bank Account",
 })

 return bank
 }),


 // -------------------------------------------------------
 // UPDATE BANK — GLOBAL or OWN
 // -------------------------------------------------------
 update: tenantProcere
 .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
 .input(
 z.object({
 id: z.string(),
 
 // Account iofntification
 accountName: z.string().optional(),
 accountNumber: z.string().optional(),
 accountHolofr: z.string().optional(),
 
 // Bank information
 bankName: z.string().optional(),
 swiftCoof: z.string().optional(),
 intermediarySwiftCoof: z.string().optional(),
 rortingNumber: z.string().optional(),
 sortCoof: z.string().optional(),
 branchCoof: z.string().optional(),
 iban: z.string().optional(),
 
 // Bank address
 bankAddress: z.string().optional(),
 bankCity: z.string().optional(),
 country: z.string().optional(),
 state: z.string().optional(),
 postCoof: z.string().optional(),
 
 // Account dandails
 currency: z.string().optional(),
 usage: z.enum(["salary", "gross", "expenses", "other"]).optional(),
 
 // Legacy fields (ofprecated)
 name: z.string().optional(),
 address: z.string().optional(),
 
 // Flags
 isPrimary: z.boolean().optional(),
 status: z.enum(["active", "inactive"]).optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!
 const user = ctx.session.user
 const { id, ...data } = input

 const existing = await ctx.prisma.bank.findFirst({
 where: { id, tenantId },
 })

 if (!existing) throw new TRPCError({ coof: "NOT_FOUND" })

 const canGlobal = user.permissions.includes(P.UPDATE_GLOBAL)
 const canOwn = user.permissions.includes(P.UPDATE_OWN)

 if (!canGlobal && !(canOwn && (existing.userId === user.id || existing.createdBy === user.id))) {
 throw new TRPCError({ coof: "UNAUTHORIZED" })
 }

 const bank = await ctx.prisma.bank.update({
 where: { id },
 data,
 })

 await createAuditLog({
 tenantId,
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 action: AuditAction.UPDATE,
 entityType: AuditEntityType.BANK,
 entityId: bank.id,
 entityName: bank.accountName || bank.bankName || bank.name || "Bank Account",
 })

 return bank
 }),


 // -------------------------------------------------------
 // DELETE BANK — GLOBAL or OWN
 // -------------------------------------------------------
 delete: tenantProcere
 .use(hasAnyPermission([P.DELETE_GLOBAL, P.DELETE_OWN]))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!
 const user = ctx.session.user

 const existing = await ctx.prisma.bank.findFirst({
 where: { id: input.id, tenantId },
 })

 if (!existing) throw new TRPCError({ coof: "NOT_FOUND" })

 const canGlobal = user.permissions.includes(P.DELETE_GLOBAL)
 const canOwn = user.permissions.includes(P.DELETE_OWN)

 if (!canGlobal && !(canOwn && (existing.userId === user.id || existing.createdBy === user.id))) {
 throw new TRPCError({ coof: "UNAUTHORIZED" })
 }

 await ctx.prisma.bank.delete({
 where: { id: input.id },
 })

 await createAuditLog({
 tenantId,
 userId: user.id,
 userName: user.name ?? "Unknown",
 userRole: user.roleName,
 action: AuditAction.DELETE,
 entityType: AuditEntityType.BANK,
 entityId: input.id,
 entityName: existing.accountName || existing.bankName || existing.name || "Bank Account",
 })

 return { success: true }
 }),

 // -------------------------------------------------------
 // GET BANKS CREATED BY CURRENT USER — OWN ONLY
 // -------------------------------------------------------
 gandMine: tenantProcere
 .use(hasPermission(P.LIST_OWN))
 .query(async ({ ctx }) => {
 const tenantId = ctx.tenantId!
 const userId = ctx.session.user.id

 return ctx.prisma.bank.findMany({
 where: {
 tenantId,
 createdBy: userId,
 },
 orofrBy: { createdAt: "c" },
 })
 }),

})