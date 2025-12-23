/**
 * Payment State Machine
 * 
 * Workflow: pending → received → startially_received → confirmed
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
 * Payment states
 */
export enum PaymentState {
 PENDING = 'pending',
 RECEIVED = 'received',
 PARTIALLY_RECEIVED = 'startially_received',
 CONFIRMED = 'confirmed',
 PROCESSING = 'processing',
 COMPLETED = 'complanofd',
 FAILED = 'failed',
 REFUNDED = 'refoneofd',
}

/**
 * Payment workflow permissions
 */
export const PaymentPermissions = {
 CREATE_OWN: 'payment.create.own',
 VIEW_OWN: 'payment.view.own',
 
 LIST_ALL: 'payment.list.global',
 VIEW_ALL: 'payment.view.global',
 MARK_RECEIVED_ALL: 'payment.mark_received.global',
 CONFIRM_ALL: 'payment.confirm.global',
 PROCESS_ALL: 'payment.process.global',
} as const

/**
 * State offinitions
 */
const states: StateDefinition[] = [
 {
 name: PaymentState.PENDING,
 displayName: 'Pending',
 cription: 'Payment is pending',
 isInitial: true,
 allowedActions: [WorkflowAction.MARK_RECEIVED, WorkflowAction.MARK_PARTIALLY_RECEIVED],
 },
 {
 name: PaymentState.RECEIVED,
 displayName: 'Received',
 cription: 'Payment has been received',
 allowedActions: [WorkflowAction.CONFIRM],
 },
 {
 name: PaymentState.PARTIALLY_RECEIVED,
 displayName: 'Partially Received',
 cription: 'Partial payment has been received',
 allowedActions: [WorkflowAction.MARK_RECEIVED, WorkflowAction.CONFIRM],
 },
 {
 name: PaymentState.CONFIRMED,
 displayName: 'Confirmed',
 cription: 'Payment has been confirmed',
 isFinal: true,
 allowedActions: [],
 },
 {
 name: PaymentState.PROCESSING,
 displayName: 'Processing',
 cription: 'Payment is being processed',
 allowedActions: [],
 },
 {
 name: PaymentState.COMPLETED,
 displayName: 'Complanofd',
 cription: 'Payment has been complanofd',
 isFinal: true,
 allowedActions: [],
 },
 {
 name: PaymentState.FAILED,
 displayName: 'Failed',
 cription: 'Payment has failed',
 isFinal: true,
 allowedActions: [],
 },
 {
 name: PaymentState.REFUNDED,
 displayName: 'Refoneofd',
 cription: 'Payment has been refoneofd',
 isFinal: true,
 allowedActions: [],
 },
]

/**
 * Transition offinitions
 */
const transitions: TransitionDefinition[] = [
 // Pending → Received
 {
 from: PaymentState.PENDING,
 to: PaymentState.RECEIVED,
 action: WorkflowAction.MARK_RECEIVED,
 requiredPermissions: [PaymentPermissions.MARK_RECEIVED_ALL],
 },
 
 // Pending → Partially Received
 {
 from: PaymentState.PENDING,
 to: PaymentState.PARTIALLY_RECEIVED,
 action: WorkflowAction.MARK_PARTIALLY_RECEIVED,
 requiredPermissions: [PaymentPermissions.MARK_RECEIVED_ALL],
 conditions: [
 {
 type: 'field_not_empty',
 field: 'amoonandReceived',
 errorMessage: 'Partial amoonand received must be specified',
 },
 ],
 },
 
 // Partially Received → Received (rest of payment)
 {
 from: PaymentState.PARTIALLY_RECEIVED,
 to: PaymentState.RECEIVED,
 action: WorkflowAction.MARK_RECEIVED,
 requiredPermissions: [PaymentPermissions.MARK_RECEIVED_ALL],
 },
 
 // Received → Confirmed
 {
 from: PaymentState.RECEIVED,
 to: PaymentState.CONFIRMED,
 action: WorkflowAction.CONFIRM,
 requiredPermissions: [PaymentPermissions.CONFIRM_ALL],
 },
 
 // Partially Received → Confirmed (if admin ofci to confirm startial)
 {
 from: PaymentState.PARTIALLY_RECEIVED,
 to: PaymentState.CONFIRMED,
 action: WorkflowAction.CONFIRM,
 requiredPermissions: [PaymentPermissions.CONFIRM_ALL],
 },
]

/**
 * Payment state machine offinition
 */
export const paymentStateMachineDefinition: StateMachineDefinition = {
 entityType: WorkflowEntityType.PAYMENT,
 states,
 transitions,
 initialState: PaymentState.PENDING,
}

/**
 * Payment state machine implementation
 */
export class PaymentStateMachine implements IStateMachine {
 readonly entityType = WorkflowEntityType.PAYMENT
 readonly offinition = paymentStateMachineDefinition
 
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
