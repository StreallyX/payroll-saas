/**
 * Payslip State Machine
 * 
 * Workflow: generated → validated → sent
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
 * Payslip states
 */
export enum PayslipState {
  GENERATED = 'generated',
  VALIDATED = 'validated',
  SENT = 'sent',
  PAID = 'paid',
}

/**
 * Payslip workflow permissions
 */
export const PayslipPermissions = {
  VIEW_OWN: 'payslip.view.own',
  
  LIST_ALL: 'payslip.list.global',
  VIEW_ALL: 'payslip.view.global',
  GENERATE_ALL: 'payslip.generate.global',
  VALIDATE_ALL: 'payslip.validate.global',
  SEND_ALL: 'payslip.send.global',
  MARK_PAID_ALL: 'payslip.mark_paid.global',
} as const

/**
 * State definitions
 */
const states: StateDefinition[] = [
  {
    name: PayslipState.GENERATED,
    displayName: 'Generated',
    description: 'Payslip has been generated',
    isInitial: true,
    allowedActions: [WorkflowAction.VALIDATE],
  },
  {
    name: PayslipState.VALIDATED,
    displayName: 'Validated',
    description: 'Payslip has been validated',
    allowedActions: [WorkflowAction.SEND],
  },
  {
    name: PayslipState.SENT,
    displayName: 'Sent',
    description: 'Payslip has been sent to employee',
    allowedActions: [WorkflowAction.MARK_PAID],
  },
  {
    name: PayslipState.PAID,
    displayName: 'Paid',
    description: 'Payment associated with payslip has been made',
    isFinal: true,
    allowedActions: [],
  },
]

/**
 * Transition definitions
 */
const transitions: TransitionDefinition[] = [
  // Generated → Validated
  {
    from: PayslipState.GENERATED,
    to: PayslipState.VALIDATED,
    action: WorkflowAction.VALIDATE,
    requiredPermissions: [PayslipPermissions.VALIDATE_ALL],
  },
  
  // Validated → Sent
  {
    from: PayslipState.VALIDATED,
    to: PayslipState.SENT,
    action: WorkflowAction.SEND,
    requiredPermissions: [PayslipPermissions.SEND_ALL],
  },
  
  // Sent → Paid
  {
    from: PayslipState.SENT,
    to: PayslipState.PAID,
    action: WorkflowAction.MARK_PAID,
    requiredPermissions: [PayslipPermissions.MARK_PAID_ALL],
  },
]

/**
 * Payslip state machine definition
 */
export const payslipStateMachineDefinition: StateMachineDefinition = {
  entityType: WorkflowEntityType.PAYSLIP,
  states,
  transitions,
  initialState: PayslipState.GENERATED,
}

/**
 * Payslip state machine implementation
 */
export class PayslipStateMachine implements IStateMachine {
  readonly entityType = WorkflowEntityType.PAYSLIP
  readonly definition = payslipStateMachineDefinition
  
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
