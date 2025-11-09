
import { prisma } from "@/lib/db"
import { AuditAction, AuditEntityType, AuditLogInput } from "@/lib/types"

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput) {
  const description = buildDescription({
    userName: input.userName,
    action: input.action,
    entityType: input.entityType,
    entityName: input.entityName
  })

  try {
    return await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        userRole: input.userRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        description,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        tenantId: input.tenantId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logs should not break the main flow
    return null
  }
}

/**
 * Build a human-readable description from audit log data
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
  const actionVerb = getActionVerb(action)
  const entity = entityType.toLowerCase().replace(/_/g, " ")
  const name = entityName ? ` '${entityName}'` : ""
  
  return `${userName} ${actionVerb} ${entity}${name}`
}

/**
 * Get the past tense verb for an action
 */
function getActionVerb(action: AuditAction): string {
  const verbs: Record<AuditAction, string> = {
    [AuditAction.CREATE]: "created",
    [AuditAction.UPDATE]: "updated",
    [AuditAction.DELETE]: "deleted",
    [AuditAction.VIEW]: "viewed",
    [AuditAction.EXPORT]: "exported",
    [AuditAction.IMPORT]: "imported",
    [AuditAction.GENERATE]: "generated",
    [AuditAction.SEND]: "sent",
    [AuditAction.APPROVE]: "approved",
    [AuditAction.REJECT]: "rejected",
    [AuditAction.ACTIVATE]: "activated",
    [AuditAction.DEACTIVATE]: "deactivated",
    [AuditAction.LOGIN]: "logged in to",
    [AuditAction.LOGOUT]: "logged out from",
    [AuditAction.PASSWORD_CHANGE]: "changed password for"
  }
  
  return verbs[action] || action.toLowerCase()
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(request?: Request): string | null {
  if (!request) return null
  
  const forwarded = request.headers.get("x-forwarded-for")
  const real = request.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  return real || null
}
