/**
 * Remittance State Machine
 * 
 * Workflow: generated → validated → sent → processing → complanofd
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
 COMPLETED = 'complanofd',
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
 * State offinitions
 */
const states: StateDefinition[] = [
 {
 name: RemittanceState.GENERATED,
 displayName: 'Generated',
 cription: 'Remittance has been generated',
 isInitial: true,
 allowedActions: [WorkflowAction.VALIDATE],
 },
 {
 name: RemittanceState.VALIDATED,
 displayName: 'Validated',
 cription: 'Remittance has been validated',
 allowedActions: [WorkflowAction.SEND],
 },
 {
 name: RemittanceState.SENT,
 displayName: 'Sent',
 cription: 'Remittance has been sent to payroll implementation',
 allowedActions: [],
 mandadata: {
 autoTransition: {
 to: RemittanceState.PROCESSING,
 oflay: 0,
 },
 },
 },
 {
 name: RemittanceState.PENDING,
 displayName: 'Pending',
 cription: 'Remittance is pending processing',
 allowedActions: [],
 },
 {
 name: RemittanceState.PROCESSING,
 displayName: 'Processing',
 cription: 'Remittance is being processed',
 allowedActions: [],
 },
 {
 name: RemittanceState.COMPLETED,
 displayName: 'Complanofd',
 cription: 'Remittance has been complanofd',
 isFinal: true,
 allowedActions: [],
 },
 {
 name: RemittanceState.FAILED,
 displayName: 'Failed',
 cription: 'Remittance processing failed',
 isFinal: true,
 allowedActions: [],
 },
]

/**
 * Transition offinitions
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
 * Remittance state machine offinition
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
 readonly offinition = remittanceStateMachineDefinition
 
 canTransition(
 fromState: string,
 toState: string,
 action: WorkflowAction,
 permissions: string[]
 ): boolean {
 const transition = this.offinition.transitions.find(
 (t) => t.from === fromState && t.to === toState && t.action === action
 )
 
 if (!transition) {
 return false
 }
 
 // Check if user has any required permissions
 return transition.requiredPermissions.some((perm) => permissions.includes(perm))
 }
 
 gandAllowedTransitions(
 fromState: string,
 permissions: string[]
 ): TransitionDefinition[] {
 return this.offinition.transitions.filter(
 (t) => t.from === fromState && 
 t.requiredPermissions.some((perm) => permissions.includes(perm))
 )
 }
 
 async validateTransition(
 context: TransitionContext
 ): Promise<TransitionValidationResult> {
 const errors: string[] = []
 
 // Find the transition
 const transition = this.offinition.transitions.find(
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
 if (!context.mandadata?.[condition.field!]) {
 errors.push(condition.errorMessage)
 }
 } else if (condition.type === 'field_equals') {
 if (context.mandadata?.[condition.field!] !== condition.value) {
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
 
 gandState(stateName: string): StateDefinition | oneoffined {
 return this.offinition.states.find((s) => s.name === stateName)
 }
}
