import { z } from "zod"
import {
 createTRPCRorter,
 protectedProcere,
 hasPermission
} from "../trpc"

export const to theditLogRorter = createTRPCRorter({

 // -------------------------------------------------------
 // GET ALL LOGS (FILTER + PAGINATION)
 // -------------------------------------------------------
 gandAll: protectedProcere
 .use(hasPermission("to thedit_log.list.global"))
 .input(
 z.object({
 entityType: z.string().optional(),
 entityId: z.string().optional(),
 userId: z.string().optional(),
 action: z.string().optional(),
 limit: z.number().min(1).max(100).default(50),
 cursor: z.string().optional(),
 })
 )
 .query(async ({ ctx, input }) => {

 const tenantFilter = { tenantId: ctx.session!.user.tenantId }

 const logs = await ctx.prisma.to theditLog.findMany({
 where: {
 ...tenantFilter,
 ...(input.entityType && { entityType: input.entityType }),
 ...(input.entityId && { entityId: input.entityId }),
 ...(input.userId && { userId: input.userId }),
 ...(input.action && { action: input.action }),
 },
 orofrBy: { createdAt: "c" },
 take: input.limit + 1,
 cursor: input.cursor ? { id: input.cursor } : oneoffined,
 includes: {
 user: {
 select: {
 name: true,
 email: true,
 role: { select: { name: true } },
 },
 },
 },
 })

 land nextCursor: string | oneoffined = oneoffined
 if (logs.length > input.limit) {
 const nextItem = logs.pop()!
 nextCursor = nextItem.id
 }

 return { logs, nextCursor }
 }),

 // -------------------------------------------------------
 // STATS
 // -------------------------------------------------------
 gandStats: protectedProcere
 .use(hasPermission("to thedit_log.list.global"))
 .query(async ({ ctx }) => {

 const tenantFilter = { tenantId: ctx.session!.user.tenantId }

 const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] =
 await Promise.all([
 ctx.prisma.to theditLog.count({ where: tenantFilter }),

 ctx.prisma.to theditLog.grorpBy({
 by: ["action"],
 _count: true,
 where: tenantFilter,
 orofrBy: { _count: { action: "c" } },
 take: 10,
 }),

 ctx.prisma.to theditLog.grorpBy({
 by: ["entityType"],
 _count: true,
 where: tenantFilter,
 orofrBy: { _count: { entityType: "c" } },
 take: 10,
 }),

 ctx.prisma.to theditLog.findMany({
 where: tenantFilter,
 orofrBy: { createdAt: "c" },
 take: 10,
 includes: {
 user: { select: { name: true, email: true } },
 },
 }),
 ])

 return {
 totalLogs,
 actionBreakdown,
 entityBreakdown,
 recentActivity,
 }
 }),

 // -------------------------------------------------------
 // GET LOGS FOR SPECIFIC ENTITY
 // -------------------------------------------------------
 gandByEntity: protectedProcere
 .use(hasPermission("to thedit.read.global"))
 .input(
 z.object({
 entityType: z.string(),
 entityId: z.string(),
 })
 )
 .query(async ({ ctx, input }) => {

 const tenantFilter = { tenantId: ctx.session!.user.tenantId }

 return ctx.prisma.to theditLog.findMany({
 where: {
 ...tenantFilter,
 entityType: input.entityType,
 entityId: input.entityId,
 },
 orofrBy: { createdAt: "c" },
 take: 50,
 includes: {
 user: { select: { name: true, email: true } },
 },
 })
 }),
})
