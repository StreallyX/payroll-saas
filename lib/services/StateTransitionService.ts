/**
 * StateTransitionService
 * 
 * Validates and executes state transitions with RBAC checks
 * Provides a high-level API for state transitions across all entities
 */

import { prisma } from '@/lib/db'
import {
  WorkflowEntityType,
  WorkflowAction,
  getStateMachine,
  TransitionDefinition,
} from '@/lib/workflows'
import { WorkflowExecutionService } from './WorkflowExecutionService'
import { getUserPermissions } from '@/lib/permissions'

export interface TransitionRequest {
  entityType: WorkflowEntityType
  entityId: string
  action: WorkflowAction
  userId: string
  tenantId: string
  reason?: string
  metadata?: Record<string, any>
}

export interface TransitionValidation {
  canTransition: boolean
  errors: string[]
  allowedTransitions: TransitionDefinition[]
  currentState: string
}

export class StateTransitionService {
  /**
   * Validate if a user can perform a transition
   */
  static async validateTransition(
    request: TransitionRequest
  ): Promise<TransitionValidation> {
    const { entityType, entityId, action, userId, tenantId } = request

    const errors: string[] = []

    try {
      // Get user permissions
      const permissions = await getUserPermissions(userId)

      // Get current entity
      const entity = await this.getEntity(entityType, entityId, tenantId)
      if (!entity) {
        return {
          canTransition: false,
          errors: ['Entity not found'],
          allowedTransitions: [],
          currentState: '',
        }
      }

      const currentState = entity.workflowState || entity.status

      // Get state machine
      const stateMachine = getStateMachine(entityType)

      // Get allowed transitions
      const allowedTransitions = stateMachine.getAllowedTransitions(
        currentState,
        permissions
      )

      // Check if the requested action is in allowed transitions
      const requestedTransition = allowedTransitions.find(
        (t) => t.action === action
      )

      if (!requestedTransition) {
        errors.push(
          'You do not have permission to perform this action or the transition is not allowed from the current state'
        )
        return {
          canTransition: false,
          errors,
          allowedTransitions,
          currentState,
        }
      }

      return {
        canTransition: true,
        errors: [],
        allowedTransitions,
        currentState,
      }
    } catch (error) {
      console.error('Error validating transition:', error)
      return {
        canTransition: false,
        errors: ['An error occurred while validating the transition'],
        allowedTransitions: [],
        currentState: '',
      }
    }
  }

  /**
   * Execute a state transition
   */
  static async executeTransition(request: TransitionRequest) {
    const { entityType, entityId, action, userId, tenantId, reason, metadata } = request

    // First validate
    const validation = await this.validateTransition(request)
    if (!validation.canTransition) {
      return {
        success: false,
        errors: validation.errors,
      }
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!user) {
      return {
        success: false,
        errors: ['User not found'],
      }
    }

    // Get user permissions
    const permissions = await getUserPermissions(userId)

    // Find the target state for this action
    const allowedTransition = validation.allowedTransitions.find(
      (t) => t.action === action
    )

    if (!allowedTransition) {
      return {
        success: false,
        errors: ['Transition not found'],
      }
    }

    // Execute the transition
    return WorkflowExecutionService.executeTransition({
      entityType,
      entityId,
      action,
      toState: allowedTransition.to,
      userId,
      userRole: user.role.name,
      tenantId,
      userName: user.name || user.email,
      userPermissions: permissions,
      reason,
      metadata,
    })
  }

  /**
   * Get available actions for an entity
   */
  static async getAvailableActions(
    entityType: WorkflowEntityType,
    entityId: string,
    userId: string,
    tenantId: string
  ): Promise<{
    actions: WorkflowAction[]
    transitions: TransitionDefinition[]
    currentState: string
  }> {
    try {
      // Get user permissions
      const permissions = await getUserPermissions(userId)

      // Get current entity
      const entity = await this.getEntity(entityType, entityId, tenantId)
      if (!entity) {
        return {
          actions: [],
          transitions: [],
          currentState: '',
        }
      }

      const currentState = entity.workflowState || entity.status

      // Get state machine
      const stateMachine = getStateMachine(entityType)

      // Get allowed transitions
      const transitions = stateMachine.getAllowedTransitions(
        currentState,
        permissions
      )

      // Extract unique actions
      const actions = [...new Set(transitions.map((t) => t.action))]

      return {
        actions,
        transitions,
        currentState,
      }
    } catch (error) {
      console.error('Error getting available actions:', error)
      return {
        actions: [],
        transitions: [],
        currentState: '',
      }
    }
  }

  /**
   * Check if user can perform specific action
   */
  static async canPerformAction(
    entityType: WorkflowEntityType,
    entityId: string,
    action: WorkflowAction,
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    const validation = await this.validateTransition({
      entityType,
      entityId,
      action,
      userId,
      tenantId,
    })

    return validation.canTransition
  }

  /**
   * Get state history for an entity
   */
  static async getStateHistory(
    entityType: WorkflowEntityType,
    entityId: string,
    tenantId: string
  ) {
    return WorkflowExecutionService.getStateHistory(entityType, entityId, tenantId)
  }

  /**
   * Helper: Get entity by type and ID
   */
  private static async getEntity(
    entityType: WorkflowEntityType,
    entityId: string,
    tenantId: string
  ): Promise<any> {
    const where = { id: entityId, tenantId }

    switch (entityType) {
      case WorkflowEntityType.TIMESHEET:
        return prisma.timesheet.findUnique({ where })
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
   * Batch transition for multiple entities (e.g., bulk approval)
   */
  static async batchTransition(
    requests: TransitionRequest[]
  ): Promise<{
    success: boolean
    results: Array<{
      entityId: string
      success: boolean
      errors: string[]
    }>
  }> {
    const results = await Promise.all(
      requests.map(async (request) => {
        const result = await this.executeTransition(request)
        return {
          entityId: request.entityId,
          success: result.success,
          errors: result.errors,
        }
      })
    )

    const allSuccess = results.every((r) => r.success)

    return {
      success: allSuccess,
      results,
    }
  }
}
