/**
 * Remittance State Machine
 * 
 * Workflow: generated → validated → sent → processing → completed
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
 * Remittance states
 */
export enum RemittanceState {
  GENERATED = 'generated',
  VALIDATED = 'validated',
  SENT = 'sent',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Remittance workflow permissions
 */
export const RemittancePermissions = {
  VIEW_OWN: 'remittance.view.own',
  
  LIST_ALL: 'remittance.list.global',
  VIEW_ALL: 'remittance.view.global',
  GENERATE_ALL: 'remittance.generate.global',
  VALIDATE_ALL: 'remittance.validate.global',
  SEND_ALL: 'remittance.send.global',
  PROCESS_ALL: 'remittance.process.global',
} as const

/**
 * State definitions
 */
const states: StateDefinition[] = [
  {
    name: RemittanceState.GENERATED,
    displayName: 'Generated',
    description: 'Remittance has been generated',
    isInitial: true,
    allowedActions: [WorkflowAction.VALIDATE],
  },
  {
    name: RemittanceState.VALIDATED,
    displayName: 'Validated',
    description: 'Remittance has been validated',
    allowedActions: [WorkflowAction.SEND],
  },
  {
    name: RemittanceState.SENT,
    displayName: 'Sent',
    description: 'Remittance has been sent to payroll provider',
    allowedActions: [],
    metadata: {
      autoTransition: {
        to: RemittanceState.PROCESSING,
        delay: 0,
      },
    },
  },
  {
    name: RemittanceState.PENDING,
    displayName: 'Pending',
    description: 'Remittance is pending processing',
    allowedActions: [],
  },
  {
    name: RemittanceState.PROCESSING,
    displayName: 'Processing',
    description: 'Remittance is being processed',
    allowedActions: [],
  },
  {
    name: RemittanceState.COMPLETED,
    displayName: 'Completed',
    description: 'Remittance has been completed',
    isFinal: true,
    allowedActions: [],
  },
  {
    name: RemittanceState.FAILED,
    displayName: 'Failed',
    description: 'Remittance processing failed',
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
    from: RemittanceState.GENERATED,
    to: RemittanceState.VALIDATED,
    action: WorkflowAction.VALIDATE,
    requiredPermissions: [RemittancePermissions.VALIDATE_ALL],
  },
  
  // Validated → Sent
  {
    from: RemittanceState.VALIDATED,
    to: RemittanceState.SENT,
    action: WorkflowAction.SEND,
    requiredPermissions: [RemittancePermissions.SEND_ALL],
  },
]

/**
 * Remittance state machine definition
 */
export const remittanceStateMachineDefinition: StateMachineDefinition = {
  entityType: WorkflowEntityType.REMITTANCE,
  states,
  transitions,
  initialState: RemittanceState.GENERATED,
}

/**
 * Remittance state machine implementation
 */
export class RemittanceStateMachine implements IStateMachine {
  readonly entityType = WorkflowEntityType.REMITTANCE
  readonly definition = remittanceStateMachineDefinition
  
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
