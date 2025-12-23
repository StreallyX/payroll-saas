/**
 * Workflow System Types
 * 
 * Core types for the state machine and workflow system
 */

/**
 * Workflow entity types
 */
export enum WorkflowEntityType {
  TIMESHEET = 'timesheet',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  PAYSLIP = 'payslip',
  REMITTANCE = 'remittance',
}

/**
 * Workflow action types
 */
export enum WorkflowAction {
  SUBMIT = 'submit',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  SEND = 'send',
  CONFIRM_MARGIN = 'confirm_margin',
  MARK_PAID_BY_AGENCY = 'mark_paid_by_agency',
  MARK_PAYMENT_RECEIVED = 'mark_payment_received',
  MARK_PAID = 'mark_paid',
  MARK_RECEIVED = 'mark_received',
  MARK_PARTIALLY_RECEIVED = 'mark_partially_received',
  CONFIRM = 'confirm',
  VALIDATE = 'validate',
  GENERATE = 'generate',
  CANCEL = 'cancel',
}

/**
 * State definition
 */
export interface StateDefinition {
  name: string
  displayName: string
  description?: string
  isFinal?: boolean // Terminal state
  isInitial?: boolean // Starting state
  allowedActions: WorkflowAction[]
  metadata?: Record<string, any>
}

/**
 * Transition definition
 */
export interface TransitionDefinition {
  from: string
  to: string
  action: WorkflowAction
  requiredPermissions: string[]
  conditions?: TransitionCondition[]
  sideEffects?: TransitionSideEffect[]
  metadata?: Record<string, any>
}

/**
 * Transition condition
 */
export interface TransitionCondition {
  type: 'field_equals' | 'field_not_empty' | 'custom'
  field?: string
  value?: any
  customCheck?: (context: TransitionContext) => Promise<boolean>
  errorMessage: string
}

/**
 * Transition side effect
 */
export interface TransitionSideEffect {
  type: 'create_audit_log' | 'send_notification' | 'update_related_entity' | 'custom'
  config: Record<string, any>
  execute?: (context: TransitionContext) => Promise<void>
}

/**
 * Transition context
 */
export interface TransitionContext {
  entityType: WorkflowEntityType
  entityId: string
  entity: any // The actual entity data
  userId: string
  userRole: string
  tenantId: string
  action: WorkflowAction
  fromState: string
  toState: string
  reason?: string
  metadata?: Record<string, any>
}

/**
 * State machine definition
 */
export interface StateMachineDefinition {
  entityType: WorkflowEntityType
  states: StateDefinition[]
  transitions: TransitionDefinition[]
  initialState: string
}

/**
 * Transition validation result
 */
export interface TransitionValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * State machine
 */
export interface IStateMachine {
  readonly entityType: WorkflowEntityType
  readonly definition: StateMachineDefinition
  
  /**
   * Check if a transition is allowed
   */
  canTransition(
    fromState: string,
    toState: string,
    action: WorkflowAction,
    permissions: string[]
  ): boolean
  
  /**
   * Get allowed transitions from a state
   */
  getAllowedTransitions(
    fromState: string,
    permissions: string[]
  ): TransitionDefinition[]
  
  /**
   * Validate a transition
   */
  validateTransition(
    context: TransitionContext
  ): Promise<TransitionValidationResult>
  
  /**
   * Get state definition
   */
  getState(stateName: string): StateDefinition | undefined
}
