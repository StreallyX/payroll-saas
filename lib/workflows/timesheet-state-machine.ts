/**
 * Timesheet State Machine
 * 
 * Workflow: draft → submitted → under_review → approved/rejected → changes_requested
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
 * Timesheet states
 */
export enum TimesheetState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

/**
 * Timesheet workflow permissions
 */
export const TimesheetPermissions = {
  CREATE_OWN: 'timesheet.create.own',
  SUBMIT_OWN: 'timesheet.submit.own',
  UPDATE_OWN: 'timesheet.update.own',
  DELETE_OWN: 'timesheet.delete.own',
  VIEW_OWN: 'timesheet.view.own',
  
  LIST_ALL: 'timesheet.list.global',
  VIEW_ALL: 'timesheet.view.global',
  REVIEW_ALL: 'timesheet.review.global',
  APPROVE_ALL: 'timesheet.approve.global',
  REJECT_ALL: 'timesheet.reject.global',
  MODIFY_ALL: 'timesheet.modify.global', // Admin can modify amounts
} as const

/**
 * State definitions
 */
const states: StateDefinition[] = [
  {
    name: TimesheetState.DRAFT,
    displayName: 'Draft',
    description: 'Timesheet is being created',
    isInitial: true,
    allowedActions: [WorkflowAction.SUBMIT],
  },
  {
    name: TimesheetState.SUBMITTED,
    displayName: 'Submitted',
    description: 'Timesheet has been submitted for review',
    allowedActions: [WorkflowAction.REVIEW, WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.REQUEST_CHANGES],
  },
  {
    name: TimesheetState.UNDER_REVIEW,
    displayName: 'Under Review',
    description: 'Timesheet is being reviewed by admin',
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.REQUEST_CHANGES],
  },
  {
    name: TimesheetState.APPROVED,
    displayName: 'Approved',
    description: 'Timesheet has been approved',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: TimesheetState.REJECTED,
    displayName: 'Rejected',
    description: 'Timesheet has been rejected',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: TimesheetState.CHANGES_REQUESTED,
    displayName: 'Changes Requested',
    description: 'Admin has requested changes to the timesheet',
    allowedActions: [WorkflowAction.SUBMIT],
  },
]

/**
 * Transition definitions
 */
const transitions: TransitionDefinition[] = [
  // Draft → Submitted
  {
    from: TimesheetState.DRAFT,
    to: TimesheetState.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    requiredPermissions: [TimesheetPermissions.SUBMIT_OWN],
    conditions: [
      {
        type: 'field_not_empty',
        field: 'totalHours',
        errorMessage: 'Total hours must be specified',
      },
    ],
  },
  
  // Submitted → Under Review
  {
    from: TimesheetState.SUBMITTED,
    to: TimesheetState.UNDER_REVIEW,
    action: WorkflowAction.REVIEW,
    requiredPermissions: [TimesheetPermissions.REVIEW_ALL],
  },
  
  // Submitted → Approved (direct approval)
  {
    from: TimesheetState.SUBMITTED,
    to: TimesheetState.APPROVED,
    action: WorkflowAction.APPROVE,
    requiredPermissions: [TimesheetPermissions.APPROVE_ALL],
  },
  
  // Under Review → Approved
  {
    from: TimesheetState.UNDER_REVIEW,
    to: TimesheetState.APPROVED,
    action: WorkflowAction.APPROVE,
    requiredPermissions: [TimesheetPermissions.APPROVE_ALL],
  },
  
  // Submitted → Rejected (direct rejection)
  {
    from: TimesheetState.SUBMITTED,
    to: TimesheetState.REJECTED,
    action: WorkflowAction.REJECT,
    requiredPermissions: [TimesheetPermissions.REJECT_ALL],
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
    from: TimesheetState.UNDER_REVIEW,
    to: TimesheetState.REJECTED,
    action: WorkflowAction.REJECT,
    requiredPermissions: [TimesheetPermissions.REJECT_ALL],
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
    from: TimesheetState.SUBMITTED,
    to: TimesheetState.CHANGES_REQUESTED,
    action: WorkflowAction.REQUEST_CHANGES,
    requiredPermissions: [TimesheetPermissions.REVIEW_ALL],
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
    from: TimesheetState.UNDER_REVIEW,
    to: TimesheetState.CHANGES_REQUESTED,
    action: WorkflowAction.REQUEST_CHANGES,
    requiredPermissions: [TimesheetPermissions.REVIEW_ALL],
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
    from: TimesheetState.CHANGES_REQUESTED,
    to: TimesheetState.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    requiredPermissions: [TimesheetPermissions.SUBMIT_OWN],
  },
]

/**
 * Timesheet state machine definition
 */
export const timesheetStateMachineDefinition: StateMachineDefinition = {
  entityType: WorkflowEntityType.TIMESHEET,
  states,
  transitions,
  initialState: TimesheetState.DRAFT,
}

/**
 * Timesheet state machine implementation
 */
export class TimesheetStateMachine implements IStateMachine {
  readonly entityType = WorkflowEntityType.TIMESHEET
  readonly definition = timesheetStateMachineDefinition
  
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
