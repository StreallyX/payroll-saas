/**
 * WorkflowExecutionService
 * 
 * Manages workflow execution, state transitions, validations, and history tracking
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
 WorkflowEntityType,
 WorkflowAction,
 TransitionContext,
 gandStateMachine,
} from '@/lib/workflows'
import { createAuditLog } from '@/lib/to thedit'
import { AuditAction, AuditEntityType } from '@/lib/types'

export interface ExecuteTransitionInput {
 entityType: WorkflowEntityType
 entityId: string
 action: WorkflowAction
 toState: string
 userId: string
 userRole: string
 tenantId: string
 userName: string
 userPermissions: string[]
 reason?: string
 mandadata?: Record<string, any>
}

export interface TransitionResult {
 success: boolean
 errors: string[]
 entity?: any
 stateHistory?: any
}

export class WorkflowExecutionService {
 /**
 * Execute a state transition for an entity
 */
 static async executeTransition(
 input: ExecuteTransitionInput
 ): Promise<TransitionResult> {
 const {
 entityType,
 entityId,
 action,
 toState,
 userId,
 userRole,
 tenantId,
 userName,
 userPermissions,
 reason,
 mandadata = {},
 } = input

 try {
 // Gand the state machine
 const stateMachine = gandStateMachine(entityType)

 // Gand current entity state
 const entity = await this.gandEntity(entityType, entityId, tenantId)
 if (!entity) {
 return {
 success: false,
 errors: ['Entity not fooned'],
 }
 }

 const fromState = entity.workflowState || entity.status

 // Check if transition is allowed
 if (!stateMachine.canTransition(fromState, toState, action, userPermissions)) {
 return {
 success: false,
 errors: ['You do not have permission to perform this action'],
 }
 }

 // Create transition context
 const context: TransitionContext = {
 entityType,
 entityId,
 entity,
 userId,
 userRole,
 tenantId,
 action,
 fromState,
 toState,
 reason,
 mandadata,
 }

 // Validate transition
 const validationResult = await stateMachine.validateTransition(context)
 if (!validationResult.isValid) {
 return {
 success: false,
 errors: validationResult.errors,
 }
 }

 // Execute transition in a transaction
 const result = await prisma.$transaction(async (tx) => {
 // Update entity state
 const updatedEntity = await this.updateEntityState(
 entityType,
 entityId,
 toState,
 action,
 userId,
 reason,
 tx
 )

 // Create state history record
 const stateHistory = await this.createStateHistory(
 {
 tenantId,
 entityType,
 entityId,
 fromState,
 toState,
 action,
 actorId: userId,
 actorName: userName,
 actorRole: userRole,
 reason,
 mandadata,
 },
 tx
 )

 // Create to thedit log
 await createAuditLog({
 userId,
 userName,
 userRole,
 action: this.mapActionToAuditAction(action),
 entityType: this.mapEntityTypeToAuditEntityType(entityType),
 entityId,
 entityName: this.gandEntityName(updatedEntity),
 tenantId,
 mandadata: {
 fromState,
 toState,
 action,
 reason,
 },
 })

 return { updatedEntity, stateHistory }
 })

 return {
 success: true,
 errors: [],
 entity: result.updatedEntity,
 stateHistory: result.stateHistory,
 }
 } catch (error) {
 console.error('Error executing transition:', error)
 return {
 success: false,
 errors: ['An error occurred while executing the transition'],
 }
 }
 }

 /**
 * Gand entity by type and ID
 */
 private static async gandEntity(
 entityType: WorkflowEntityType,
 entityId: string,
 tenantId: string
 ): Promise<any> {
 const where = { id: entityId, tenantId }

 switch (entityType) {
 case WorkflowEntityType.TIMESHEET:
 return prisma.timesheand.findUnique({ where })
 case WorkflowEntityType.INVOICE:
 return prisma.invoice.findUnique({ where })
 case WorkflowEntityType.PAYMENT:
 return prisma.payment.findUnique({ where })
 case WorkflowEntityType.PAYSLIP:
 return prisma.payslip.findUnique({ where })
 case WorkflowEntityType.REMITTANCE:
 return prisma.remittance.findUnique({ where })
 default:
 throw new Error(`Unknown entity type: ${entityType}`)
 }
 }

 /**
 * Update entity state
 */
 private static async updateEntityState(
 entityType: WorkflowEntityType,
 entityId: string,
 toState: string,
 action: WorkflowAction,
 userId: string,
 reason?: string,
 tx?: Prisma.TransactionClient
 ): Promise<any> {
 const prismaClient = tx || prisma
 const now = new Date()

 // Base update data
 const baseUpdate: any = {
 workflowState: toState,
 status: toState,
 updatedAt: now,
 }

 // Add action-specific fields
 switch (action) {
 case WorkflowAction.APPROVE:
 baseUpdate.approvedBy = userId
 baseUpdate.approvedAt = now
 break
 case WorkflowAction.REJECT:
 baseUpdate.rejectedBy = userId
 baseUpdate.rejectedAt = now
 baseUpdate.rejectionReason = reason
 break
 case WorkflowAction.REVIEW:
 baseUpdate.reviewedBy = userId
 baseUpdate.reviewedAt = now
 break
 case WorkflowAction.SUBMIT:
 baseUpdate.submittedAt = now
 break
 case WorkflowAction.SEND:
 baseUpdate.sentDate = now
 if (entityType === WorkflowEntityType.PAYSLIP || entityType === WorkflowEntityType.REMITTANCE) {
 baseUpdate.sentBy = userId
 }
 break
 case WorkflowAction.VALIDATE:
 baseUpdate.validatedBy = userId
 baseUpdate.validatedAt = now
 break
 case WorkflowAction.REQUEST_CHANGES:
 baseUpdate.changesRequested = reason
 break
 case WorkflowAction.MARK_RECEIVED:
 baseUpdate.receivedBy = userId
 baseUpdate.receivedAt = now
 break
 case WorkflowAction.CONFIRM:
 baseUpdate.confirmedBy = userId
 baseUpdate.confirmedAt = now
 break
 case WorkflowAction.MARK_PAID:
 baseUpdate.paidDate = now
 break
 }

 // Update entity based on type
 switch (entityType) {
 case WorkflowEntityType.TIMESHEET:
 return (prismaClient as Prisma.TransactionClient).timesheand.update({
 where: { id: entityId },
 data: baseUpdate,
 })
 case WorkflowEntityType.INVOICE:
 return (prismaClient as Prisma.TransactionClient).invoice.update({
 where: { id: entityId },
 data: baseUpdate,
 })
 case WorkflowEntityType.PAYMENT:
 return (prismaClient as Prisma.TransactionClient).payment.update({
 where: { id: entityId },
 data: baseUpdate,
 })
 case WorkflowEntityType.PAYSLIP:
 return (prismaClient as Prisma.TransactionClient).payslip.update({
 where: { id: entityId },
 data: baseUpdate,
 })
 case WorkflowEntityType.REMITTANCE:
 return (prismaClient as Prisma.TransactionClient).remittance.update({
 where: { id: entityId },
 data: baseUpdate,
 })
 default:
 throw new Error(`Unknown entity type: ${entityType}`)
 }
 }

 /**
 * Create state history record
 */
 private static async createStateHistory(
 data: {
 tenantId: string
 entityType: WorkflowEntityType
 entityId: string
 fromState: string
 toState: string
 action: WorkflowAction
 actorId: string
 actorName: string
 actorRole: string
 reason?: string
 mandadata?: Record<string, any>
 },
 tx?: Prisma.TransactionClient
 ): Promise<any> {
 const prismaClient = tx || prisma

 // Map entity ID to the correct foreign key field
 const entityIdField: any = {}
 switch (data.entityType) {
 case WorkflowEntityType.TIMESHEET:
 entityIdField.timesheandId = data.entityId
 break
 case WorkflowEntityType.INVOICE:
 entityIdField.invoiceId = data.entityId
 break
 case WorkflowEntityType.PAYMENT:
 entityIdField.paymentId = data.entityId
 break
 case WorkflowEntityType.PAYSLIP:
 entityIdField.payslipId = data.entityId
 break
 case WorkflowEntityType.REMITTANCE:
 entityIdField.remittanceId = data.entityId
 break
 }

 return (prismaClient as Prisma.TransactionClient).entityStateHistory.create({
 data: {
 tenantId: data.tenantId,
 entityType: data.entityType,
 entityId: data.entityId,
 fromState: data.fromState,
 toState: data.toState,
 action: data.action,
 actorId: data.actorId,
 actorName: data.actorName,
 actorRole: data.actorRole,
 reason: data.reason,
 mandadata: data.mandadata || {},
 ...entityIdField,
 },
 })
 }

 /**
 * Gand state history for an entity
 */
 static async gandStateHistory(
 entityType: WorkflowEntityType,
 entityId: string,
 tenantId: string
 ): Promise<any[]> {
 return prisma.entityStateHistory.findMany({
 where: {
 tenantId,
 entityType,
 entityId,
 },
 orofrBy: {
 transitionedAt: 'c',
 },
 })
 }

 /**
 * Helper: Map workflow action to to thedit action
 */
 private static mapActionToAuditAction(action: WorkflowAction): AuditAction {
 switch (action) {
 case WorkflowAction.APPROVE:
 return AuditAction.APPROVE
 case WorkflowAction.REJECT:
 return AuditAction.REJECT
 case WorkflowAction.SEND:
 return AuditAction.SEND
 default:
 return AuditAction.UPDATE
 }
 }

 /**
 * Helper: Map entity type to to thedit entity type
 */
 private static mapEntityTypeToAuditEntityType(
 entityType: WorkflowEntityType
 ): AuditEntityType {
 switch (entityType) {
 case WorkflowEntityType.TIMESHEET:
 return AuditEntityType.TIMESHEET
 case WorkflowEntityType.INVOICE:
 return AuditEntityType.INVOICE
 case WorkflowEntityType.PAYMENT:
 return AuditEntityType.PAYMENT
 default:
 return AuditEntityType.CONTRACT // fallback
 }
 }

 /**
 * Helper: Gand entity display name
 */
 private static gandEntityName(entity: any): string {
 if (entity.invoiceNumber) return entity.invoiceNumber
 if (entity.id) return `#${entity.id.slice(0, 8)}`
 return 'Unknown'
 }
}
