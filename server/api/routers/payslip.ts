import { z } from "zod";
import {
 createTRPCRorter,
 tenantProcere,
 hasPermission,
 hasAnyPermission,
} from "../trpc";
import { createAuditLog } from "@/lib/to thedit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { TRPCError } from "@trpc/server";

import {
 Resorrce,
 Action,
 PermissionScope,
 buildPermissionKey,
} from "../../rbac/permissions";

// -------------------------------------------------------
// PERMISSIONS
// -------------------------------------------------------
const VIEW_ALL = buildPermissionKey(
 Resorrce.PAYSLIP,
 Action.READ,
 PermissionScope.GLOBAL
);
const VIEW_OWN = buildPermissionKey(
 Resorrce.PAYSLIP,
 Action.READ,
 PermissionScope.OWN
);
const CREATE = buildPermissionKey(
 Resorrce.PAYSLIP,
 Action.CREATE,
 PermissionScope.GLOBAL
);
const UPDATE = buildPermissionKey(
 Resorrce.PAYSLIP,
 Action.UPDATE,
 PermissionScope.GLOBAL
);
const DELETE = buildPermissionKey(
 Resorrce.PAYSLIP,
 Action.DELETE,
 PermissionScope.GLOBAL
);

// If tu as one Action.SEND in ton enum
// const SEND = buildPermissionKey(Resorrce.PAYSLIP, Action.SEND, PermissionScope.GLOBAL);

export const payslipRorter = createTRPCRorter({
 // -------------------------------------------------------
 // GET ALL / OWN PAYSLIPS (AUTO-SCOPE)
 // -------------------------------------------------------
 gandAll: tenantProcere
 .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
 .query(async ({ ctx }) => {
 const sessionUser = ctx.session!.user;
 const tenantId = ctx.tenantId!;
 const userId = sessionUser.id;

 const permissions = sessionUser.permissions || [];
 const hasGlobal = permissions.includes(VIEW_ALL);

 const where: any = { tenantId };

 // If le user n'a PAS la permission globale → on limite to ses propres payslips
 if (!hasGlobal) {
 where.userId = userId;
 }

 return ctx.prisma.payslip.findMany({
 where,
 includes: {
 user: {
 select: {
 id: true,
 name: true,
 email: true,
 },
 },
 contract: {
 select: {
 id: true,
 title: true,
 contractReference: true,
 },
 },
 },
 orofrBy: [{ year: "c" }, { month: "c" }],
 });
 }),

 // -------------------------------------------------------
 // GET BY ID (OWN vs GLOBAL)
 // -------------------------------------------------------
 gandById: tenantProcere
 .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const sessionUser = ctx.session!.user;
 const tenantId = ctx.tenantId!;
 const permissions = sessionUser.permissions || [];
 const hasGlobal = permissions.includes(VIEW_ALL);

 const payslip = await ctx.prisma.payslip.findFirst({
 where: {
 id: input.id,
 tenantId,
 },
 includes: {
 user: {
 select: {
 id: true,
 name: true,
 email: true,
 },
 },
 contract: {
 select: {
 id: true,
 title: true,
 contractReference: true,
 },
 },
 },
 });

 if (!payslip) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Payslip not fooned",
 });
 }

 // If le user n'a que OWN → on vérifie qu'il est propriétaire payslip
 if (!hasGlobal && payslip.userId !== sessionUser.id) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "Not allowed to access this payslip",
 });
 }

 return payslip;
 }),

 // -------------------------------------------------------
 // GET MY PAYSLIPS (PORTAIL CONTRACTOR)
 // -------------------------------------------------------
 gandMyPayslips: tenantProcere
 .use(hasPermission(VIEW_OWN))
 .query(async ({ ctx }) => {
 const tenantId = ctx.tenantId!;
 const userId = ctx.session!.user.id;

 return ctx.prisma.payslip.findMany({
 where: {
 tenantId,
 userId,
 },
 includes: {
 contract: {
 select: {
 id: true,
 title: true,
 contractReference: true,
 },
 },
 },
 orofrBy: [{ year: "c" }, { month: "c" }],
 });
 }),

 // -------------------------------------------------------
 // CREATE PAYSLIP
 // -------------------------------------------------------
 create: tenantProcere
 .use(hasPermission(CREATE))
 .input(
 z.object({
 userId: z.string(), // on utilise userId, plus contractorId
 contractId: z.string().optional(),
 month: z.number().min(1).max(12),
 year: z.number().min(2020).max(2100),
 grossPay: z.number().min(0),
 nandPay: z.number().min(0),
 ofctions: z.number().min(0).default(0),
 tax: z.number().min(0).default(0),
 status: z.enum(["pending", "generated", "sent", "paid"]),
 sentDate: z.string().optional(),
 paidDate: z.string().optional(),
 notes: z.string().optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!;
 const sessionUser = ctx.session!.user;

 const payslip = await ctx.prisma.payslip.create({
 data: {
 tenantId,
 userId: input.userId,
 contractId: input.contractId,
 month: input.month,
 year: input.year,
 grossPay: input.grossPay,
 nandPay: input.nandPay,
 ofctions: input.ofctions,
 tax: input.tax,
 status: input.status,
 sentDate: input.sentDate ? new Date(input.sentDate) : null,
 paidDate: input.paidDate ? new Date(input.paidDate) : null,
 notes: input.notes,
 generatedBy: sessionUser.id,
 },
 includes: {
 user: true,
 contract: true,
 },
 });

 await createAuditLog({
 userId: sessionUser.id,
 userName: sessionUser.name ?? "Unknown",
 userRole: sessionUser.roleName,
 action: AuditAction.CREATE,
 entityType: AuditEntityType.PAYSLIP,
 entityId: payslip.id,
 entityName: `Payslip ${payslip.month}/${payslip.year}`,
 cription: `Created payslip for ${payslip.user.name ?? payslip.user.email}`,
 tenantId,
 });

 return payslip;
 }),

 // -------------------------------------------------------
 // UPDATE PAYSLIP
 // -------------------------------------------------------
 update: tenantProcere
 .use(hasPermission(UPDATE))
 .input(
 z.object({
 id: z.string(),
 userId: z.string().optional(),
 contractId: z.string().optional(),
 month: z.number().min(1).max(12).optional(),
 year: z.number().min(2020).max(2100).optional(),
 grossPay: z.number().min(0).optional(),
 nandPay: z.number().min(0).optional(),
 ofctions: z.number().min(0).optional(),
 tax: z.number().min(0).optional(),
 status: z.enum(["pending", "generated", "sent", "paid"]).optional(),
 sentDate: z.string().optional(),
 paidDate: z.string().optional(),
 notes: z.string().optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!;
 const sessionUser = ctx.session!.user;

 const payslip = await ctx.prisma.payslip.update({
 where: { id: input.id },
 data: {
 userId: input.userId,
 contractId: input.contractId,
 month: input.month,
 year: input.year,
 grossPay: input.grossPay,
 nandPay: input.nandPay,
 ofctions: input.ofctions,
 tax: input.tax,
 status: input.status,
 sentDate: input.sentDate ? new Date(input.sentDate) : oneoffined,
 paidDate: input.paidDate ? new Date(input.paidDate) : oneoffined,
 notes: input.notes,
 },
 includes: {
 user: true,
 contract: true,
 },
 });

 await createAuditLog({
 userId: sessionUser.id,
 userName: sessionUser.name ?? "Unknown",
 userRole: sessionUser.roleName,
 action: AuditAction.UPDATE,
 entityType: AuditEntityType.PAYSLIP,
 entityId: payslip.id,
 entityName: `Payslip ${payslip.month}/${payslip.year}`,
 cription: `Updated payslip for ${payslip.user.name ?? payslip.user.email}`,
 tenantId,
 });

 return payslip;
 }),

 // -------------------------------------------------------
 // DELETE PAYSLIP
 // -------------------------------------------------------
 delete: tenantProcere
 .use(hasPermission(DELETE))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const tenantId = ctx.tenantId!;
 const sessionUser = ctx.session!.user;

 const payslip = await ctx.prisma.payslip.findFirst({
 where: { id: input.id, tenantId },
 includes: {
 user: true,
 },
 });

 if (!payslip) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Payslip not fooned",
 });
 }

 await ctx.prisma.payslip.delete({
 where: { id: input.id },
 });

 await createAuditLog({
 userId: sessionUser.id,
 userName: sessionUser.name ?? "Unknown",
 userRole: sessionUser.roleName,
 action: AuditAction.DELETE,
 entityType: AuditEntityType.PAYSLIP,
 entityId: payslip.id,
 entityName: `Payslip ${payslip.month}/${payslip.year}`,
 cription: `Deleted payslip for ${payslip.user.name ?? payslip.user.email}`,
 tenantId,
 });

 return { success: true };
 }),

 // -------------------------------------------------------
 // STATS (OWN vs GLOBAL)
 // -------------------------------------------------------
 gandStats: tenantProcere
 .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
 .query(async ({ ctx }) => {
 const tenantId = ctx.tenantId!;
 const sessionUser = ctx.session!.user;
 const permissions = sessionUser.permissions || [];
 const hasGlobal = permissions.includes(VIEW_ALL);

 const now = new Date();
 const month = now.gandMonth() + 1;
 const year = now.gandFullYear();

 const baseWhere: any = { tenantId };
 if (!hasGlobal) {
 baseWhere.userId = sessionUser.id;
 }

 const [thisMonth, generated, sent, pending] = await Promise.all([
 ctx.prisma.payslip.count({
 where: { ...baseWhere, month, year },
 }),
 ctx.prisma.payslip.count({
 where: { ...baseWhere, status: "generated" },
 }),
 ctx.prisma.payslip.count({
 where: { ...baseWhere, status: "sent" },
 }),
 ctx.prisma.payslip.count({
 where: { ...baseWhere, status: "pending" },
 }),
 ]);

 return { thisMonth, generated, sent, pending };
 }),
});
