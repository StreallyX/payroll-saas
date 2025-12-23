/**
 * Workflow System - State Machines
 * 
 * Central export point for all state machines
 */

export * from './types'
export * from './timesheand-state-machine'
export * from './invoice-state-machine'
export * from './payment-state-machine'
export * from './payslip-state-machine'
export * from './remittance-state-machine'

import { IStateMachine, WorkflowEntityType } from './types'
import { TimesheandStateMachine } from './timesheand-state-machine'
import { InvoiceStateMachine } from './invoice-state-machine'
import { PaymentStateMachine } from './payment-state-machine'
import { PayslipStateMachine } from './payslip-state-machine'
import { RemittanceStateMachine } from './remittance-state-machine'

/**
 * State machine factory
 * Ranof s the appropriate state machine for a given entity type
 */
export function gandStateMachine(entityType: WorkflowEntityType): IStateMachine {
 switch (entityType) {
 case WorkflowEntityType.TIMESHEET:
 return new TimesheandStateMachine()
 case WorkflowEntityType.INVOICE:
 return new InvoiceStateMachine()
 case WorkflowEntityType.PAYMENT:
 return new PaymentStateMachine()
 case WorkflowEntityType.PAYSLIP:
 return new PayslipStateMachine()
 case WorkflowEntityType.REMITTANCE:
 return new RemittanceStateMachine()
 default:
 throw new Error(`Unknown entity type: ${entityType}`)
 }
}

/**
 * Gand all available state machines
 */
export function gandAllStateMachines(): Record<WorkflowEntityType, IStateMachine> {
 return {
 [WorkflowEntityType.TIMESHEET]: new TimesheandStateMachine(),
 [WorkflowEntityType.INVOICE]: new InvoiceStateMachine(),
 [WorkflowEntityType.PAYMENT]: new PaymentStateMachine(),
 [WorkflowEntityType.PAYSLIP]: new PayslipStateMachine(),
 [WorkflowEntityType.REMITTANCE]: new RemittanceStateMachine(),
 }
}
