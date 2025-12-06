/**
 * Invoice State Machine
 * 
 * Workflow: draft → submitted → under_review → approved/rejected → sent → paid
 */

import {
  WorkflowEntityType,
  WorkflowAction,
  StateMachineDefinition,
  StateDefinition,
  TransitionDefinition,
  IStateMachine,
  TransitionContext,
  TransitionValidationResult,
} from './types'

/**
 * Invoice states
 */
export enum InvoiceState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  CHANGES_REQUESTED = 'changes_requested',
}

/**
 * Invoice workflow permissions
 */
export const InvoicePermissions = {
  CREATE_OWN: 'invoice.create.own',
  SUBMIT_OWN: 'invoice.submit.own',
  UPDATE_OWN: 'invoice.update.own',
  DELETE_OWN: 'invoice.delete.own',
  VIEW_OWN: 'invoice.view.own',
  
  LIST_ALL: 'invoice.list.global',
  VIEW_ALL: 'invoice.view.global',
  REVIEW_ALL: 'invoice.review.global',
  APPROVE_ALL: 'invoice.approve.global',
  REJECT_ALL: 'invoice.reject.global',
  SEND_ALL: 'invoice.send.global',
  MODIFY_ALL: 'invoice.modify.global', // Admin can modify amounts/margins
  MARK_PAID_ALL: 'invoice.mark_paid.global',
} as const

/**
 * State definitions
 */
const states: StateDefinition[] = [
  {
    name: InvoiceState.DRAFT,
    displayName: 'Draft',
    description: 'Invoice is being created',
    isInitial: true,
    allowedActions: [WorkflowAction.SUBMIT],
  },
  {
    name: InvoiceState.SUBMITTED,
    displayName: 'Submitted',
    description: 'Invoice has been submitted for review',
    allowedActions: [WorkflowAction.REVIEW, WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.REQUEST_CHANGES],
  },
  {
    name: InvoiceState.UNDER_REVIEW,
    displayName: 'Under Review',
    description: 'Invoice is being reviewed by admin',
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.REQUEST_CHANGES],
  },
  {
    name: InvoiceState.APPROVED,
    displayName: 'Approved',
    description: 'Invoice has been approved',
    allowedActions: [WorkflowAction.SEND],
  },
  {
    name: InvoiceState.REJECTED,
    displayName: 'Rejected',
    description: 'Invoice has been rejected',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: InvoiceState.SENT,
    displayName: 'Sent',
    description: 'Invoice has been sent to client',
    allowedActions: [WorkflowAction.MARK_PAID],
  },
  {
    name: InvoiceState.PAID,
    displayName: 'Paid',
    description: 'Invoice has been paid',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: InvoiceState.OVERDUE,
    displayName: 'Overdue',
    description: 'Invoice payment is overdue',
    allowedActions: [WorkflowAction.MARK_PAID],
  },
  {
    name: InvoiceState.CANCELLED,
    displayName: 'Cancelled',
    description: 'Invoice has been cancelled',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: InvoiceState.CHANGES_REQUESTED,
    displayName: 'Changes Requested',
    description: 'Admin has requested changes to the invoice',
    allowedActions: [WorkflowAction.SUBMIT],
  },
]

/**
 * Transition definitions
 */
const transitions: TransitionDefinition[] = [
  // Draft → Submitted
  {
    from: InvoiceState.DRAFT,
    to: InvoiceState.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    requiredPermissions: [InvoicePermissions.SUBMIT_OWN],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'amount',
        errorMessage: 'Invoice amount must be specified',
      },
    ],
  },
  
  // Submitted → Under Review
  {
    from: InvoiceState.SUBMITTED,
    to: InvoiceState.UNDER_REVIEW,
    action: WorkflowAction.REVIEW,
    requiredPermissions: [InvoicePermissions.REVIEW_ALL],
  },
  
  // Submitted → Approved (direct approval)
  {
    from: InvoiceState.SUBMITTED,
    to: InvoiceState.APPROVED,
    action: WorkflowAction.APPROVE,
    requiredPermissions: [InvoicePermissions.APPROVE_ALL],
  },
  
  // Under Review → Approved
  {
    from: InvoiceState.UNDER_REVIEW,
    to: InvoiceState.APPROVED,
    action: WorkflowAction.APPROVE,
    requiredPermissions: [InvoicePermissions.APPROVE_ALL],
  },
  
  // Submitted → Rejected (direct rejection)
  {
    from: InvoiceState.SUBMITTED,
    to: InvoiceState.REJECTED,
    action: WorkflowAction.REJECT,
    requiredPermissions: [InvoicePermissions.REJECT_ALL],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'rejectionReason',
        errorMessage: 'Rejection reason is required',
      },
    ],
  },
  
  // Under Review → Rejected
  {
    from: InvoiceState.UNDER_REVIEW,
    to: InvoiceState.REJECTED,
    action: WorkflowAction.REJECT,
    requiredPermissions: [InvoicePermissions.REJECT_ALL],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'rejectionReason',
        errorMessage: 'Rejection reason is required',
      },
    ],
  },
  
  // Submitted → Changes Requested
  {
    from: InvoiceState.SUBMITTED,
    to: InvoiceState.CHANGES_REQUESTED,
    action: WorkflowAction.REQUEST_CHANGES,
    requiredPermissions: [InvoicePermissions.REVIEW_ALL],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'changesRequested',
        errorMessage: 'Changes requested note is required',
      },
    ],
  },
  
  // Under Review → Changes Requested
  {
    from: InvoiceState.UNDER_REVIEW,
    to: InvoiceState.CHANGES_REQUESTED,
    action: WorkflowAction.REQUEST_CHANGES,
    requiredPermissions: [InvoicePermissions.REVIEW_ALL],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'changesRequested',
        errorMessage: 'Changes requested note is required',
      },
    ],
  },
  
  // Changes Requested → Submitted (resubmit)
  {
    from: InvoiceState.CHANGES_REQUESTED,
    to: InvoiceState.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    requiredPermissions: [InvoicePermissions.SUBMIT_OWN],
  },
  
  // Approved → Sent
  {
    from: InvoiceState.APPROVED,
    to: InvoiceState.SENT,
    action: WorkflowAction.SEND,
    requiredPermissions: [InvoicePermissions.SEND_ALL],
  },
  
  // Sent → Paid
  {
    from: InvoiceState.SENT,
    to: InvoiceState.PAID,
    action: WorkflowAction.MARK_PAID,
    requiredPermissions: [InvoicePermissions.MARK_PAID_ALL],
  },
  
  // Overdue → Paid
  {
    from: InvoiceState.OVERDUE,
    to: InvoiceState.PAID,
    action: WorkflowAction.MARK_PAID,
    requiredPermissions: [InvoicePermissions.MARK_PAID_ALL],
  },
  
  // Draft → Cancelled
  {
    from: InvoiceState.DRAFT,
    to: InvoiceState.CANCELLED,
    action: WorkflowAction.CANCEL,
    requiredPermissions: [InvoicePermissions.DELETE_OWN, InvoicePermissions.MODIFY_ALL],
  },
]

/**
 * Invoice state machine definition
 */
export const invoiceStateMachineDefinition: StateMachineDefinition = {
  entityType: WorkflowEntityType.INVOICE,
  states,
  transitions,
  initialState: InvoiceState.DRAFT,
}

/**
 * Invoice state machine implementation
 */
export class InvoiceStateMachine implements IStateMachine {
  readonly entityType = WorkflowEntityType.INVOICE
  readonly definition = invoiceStateMachineDefinition
  
  canTransition(
    fromState: string,
    toState: string,
    action: WorkflowAction,
    permissions: string[]
  ): boolean {
    const transition = this.definition.transitions.find(
      (t) => t.from === fromState && t.to === toState && t.action === action
    )
    
    if (!transition) {
      return false
    }
    
    // Check if user has any of the required permissions
    return transition.requiredPermissions.some((perm) => permissions.includes(perm))
  }
  
  getAllowedTransitions(
    fromState: string,
    permissions: string[]
  ): TransitionDefinition[] {
    return this.definition.transitions.filter(
      (t) => t.from === fromState && 
        t.requiredPermissions.some((perm) => permissions.includes(perm))
    )
  }
  
  async validateTransition(
    context: TransitionContext
  ): Promise<TransitionValidationResult> {
    const errors: string[] = []
    
    // Find the transition
    const transition = this.definition.transitions.find(
      (t) => 
        t.from === context.fromState && 
        t.to === context.toState && 
        t.action === context.action
    )
    
    if (!transition) {
      errors.push('Invalid transition')
      return { isValid: false, errors }
    }
    
    // Check conditions
    if (transition.conditions) {
      for (const condition of transition.conditions) {
        if (condition.type === 'field_not_empty') {
          if (!context.metadata?.[condition.field!]) {
            errors.push(condition.errorMessage)
          }
        } else if (condition.type === 'field_equals') {
          if (context.metadata?.[condition.field!] !== condition.value) {
            errors.push(condition.errorMessage)
          }
        } else if (condition.type === 'custom' && condition.customCheck) {
          const isValid = await condition.customCheck(context)
          if (!isValid) {
            errors.push(condition.errorMessage)
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }
  
  getState(stateName: string): StateDefinition | undefined {
    return this.definition.states.find((s) => s.name === stateName)
  }
}
