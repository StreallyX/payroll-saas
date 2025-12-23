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
  PENDING_MARGIN_CONFIRMATION = 'pending_margin_confirmation',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT = 'sent',
  MARKED_PAID_BY_AGENCY = 'marked_paid_by_agency',
  PAYMENT_RECEIVED = 'payment_received',
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
  CONFIRM_MARGIN_OWN: 'invoice.confirmMargin.own',
  PAY_OWN: 'invoice.pay.own', // Agency can mark their invoices as paid
  
  LIST_ALL: 'invoice.list.global',
  VIEW_ALL: 'invoice.view.global',
  REVIEW_ALL: 'invoice.review.global',
  APPROVE_ALL: 'invoice.approve.global',
  REJECT_ALL: 'invoice.reject.global',
  SEND_ALL: 'invoice.send.global',
  MODIFY_ALL: 'invoice.modify.global', // Admin can modify amounts/margins
  MARK_PAID_ALL: 'invoice.pay.global',
  CONFIRM_PAYMENT_ALL: 'invoice.confirm.global', // Admin can confirm payment received
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
    name: InvoiceState.PENDING_MARGIN_CONFIRMATION,
    displayName: 'Pending Margin Confirmation',
    description: 'Invoice is pending admin margin review and confirmation',
    allowedActions: [WorkflowAction.CONFIRM_MARGIN, WorkflowAction.REQUEST_CHANGES],
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
    allowedActions: [WorkflowAction.MARK_PAID_BY_AGENCY],
  },
  {
    name: InvoiceState.MARKED_PAID_BY_AGENCY,
    displayName: 'Marked Paid by Agency',
    description: 'Agency has marked invoice as paid',
    allowedActions: [WorkflowAction.MARK_PAYMENT_RECEIVED],
  },
  {
    name: InvoiceState.PAYMENT_RECEIVED,
    displayName: 'Payment Received',
    description: 'Payment has been received and confirmed',
    allowedActions: [],
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
    allowedActions: [WorkflowAction.MARK_PAID_BY_AGENCY],
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
  
  // Submitted → Pending Margin Confirmation (auto-created invoices from timesheets)
  {
    from: InvoiceState.SUBMITTED,
    to: InvoiceState.PENDING_MARGIN_CONFIRMATION,
    action: WorkflowAction.REVIEW,
    requiredPermissions: [InvoicePermissions.REVIEW_ALL],
  },
  
  // Pending Margin Confirmation → Under Review (after margin confirmed)
  {
    from: InvoiceState.PENDING_MARGIN_CONFIRMATION,
    to: InvoiceState.UNDER_REVIEW,
    action: WorkflowAction.CONFIRM_MARGIN,
    requiredPermissions: [InvoicePermissions.CONFIRM_MARGIN_OWN, InvoicePermissions.MODIFY_ALL],
  },
  
  // Submitted → Under Review (direct path for manual invoices)
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
  
  // Sent → Marked Paid by Agency
  {
    from: InvoiceState.SENT,
    to: InvoiceState.MARKED_PAID_BY_AGENCY,
    action: WorkflowAction.MARK_PAID_BY_AGENCY,
    requiredPermissions: [InvoicePermissions.PAY_OWN, InvoicePermissions.MARK_PAID_ALL],
  },
  
  // Marked Paid by Agency → Payment Received
  {
    from: InvoiceState.MARKED_PAID_BY_AGENCY,
    to: InvoiceState.PAYMENT_RECEIVED,
    action: WorkflowAction.MARK_PAYMENT_RECEIVED,
    requiredPermissions: [InvoicePermissions.CONFIRM_PAYMENT_ALL],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'amountReceived',
        errorMessage: 'Amount received must be specified',
      },
    ],
  },
  
  // Sent → Paid (legacy direct path)
  {
    from: InvoiceState.SENT,
    to: InvoiceState.PAID,
    action: WorkflowAction.MARK_PAID,
    requiredPermissions: [InvoicePermissions.MARK_PAID_ALL],
  },
  
  // Overdue → Marked Paid by Agency
  {
    from: InvoiceState.OVERDUE,
    to: InvoiceState.MARKED_PAID_BY_AGENCY,
    action: WorkflowAction.MARK_PAID_BY_AGENCY,
    requiredPermissions: [InvoicePermissions.PAY_OWN, InvoicePermissions.MARK_PAID_ALL],
  },
  
  // Overdue → Paid (legacy direct path)
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
