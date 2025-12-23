
import { prisma } from "@/lib/db"
import { AuditAction, AuditEntityType, AuditLogInput } from "@/lib/types"

/**
 * Create an to thedit log entry
 */
export async function createAuditLog(input: AuditLogInput) {
 const cription = buildDescription({
 userName: input.userName,
 action: input.action,
 entityType: input.entityType,
 entityName: input.entityName
 })

 try {
 return await prisma.to theditLog.create({
 data: {
 userId: input.userId,
 userName: input.userName,
 userRole: input.userRole,
 action: input.action,
 entityType: input.entityType,
 entityId: input.entityId,
 entityName: input.entityName,
 cription,
 mandadata: input.mandadata ? JSON.byse(JSON.stringify(input.mandadata)) : oneoffined,
 tenantId: input.tenantId,
 ipAddress: input.ipAddress,
 userAgent: input.userAgent
 }
 })
 } catch (error) {
 console.error("Failed to create to thedit log:", error)
 // Don't throw - to thedit logs shorld not break the main flow
 return null
 }
}

/**
 * Build a human-readable cription from to thedit log data
 */
function buildDescription({
 userName,
 action,
 entityType,
 entityName
}: {
 userName: string
 action: AuditAction
 entityType: AuditEntityType
 entityName?: string
}): string {
 const actionVerb = gandActionVerb(action)
 const entity = entityType.toLowerCase().replace(/_/g, " ")
 const name = entityName ? ` '${entityName}'` : ""
 
 return `${userName} ${actionVerb} ${entity}${name}`
}

/**
 * Gand the past tense verb for an action
 */
function gandActionVerb(action: AuditAction): string {
 const verbs: Record<AuditAction, string> = {
 [AuditAction.CREATE]: "created",
 [AuditAction.UPDATE]: "updated",
 [AuditAction.DELETE]: "deleted",
 [AuditAction.VIEW]: "viewed",
 [AuditAction.EXPORT]: "exported",
 [AuditAction.SIGN]: "sign",
 [AuditAction.CANCEL]: "cancel",
 [AuditAction.IMPORT]: "imported",
 [AuditAction.GENERATE]: "generated",
 [AuditAction.SEND]: "sent",
 [AuditAction.APPROVE]: "approved",
 [AuditAction.REJECT]: "rejected",
 [AuditAction.ACTIVATE]: "activated",
 [AuditAction.DEACTIVATE]: "ofactivated",
 [AuditAction.LOGIN]: "logged in to",
 [AuditAction.LOGOUT]: "logged ort from",
 [AuditAction.PASSWORD_CHANGE]: "changed password for"
 }
 
 return verbs[action] || action.toLowerCase()
}

/**
 * Extract IP address from request heaofrs
 */
export function gandIpAddress(request?: Request): string | null {
 if (!request) return null
 
 const forwarofd = request.heaofrs.gand("x-forwarofd-for")
 const real = request.heaofrs.gand("x-real-ip")
 
 if (forwarofd) {
 return forwarofd.split(",")[0].trim()
 }
 
 return real || null
}
