/**
 * PaymentModel Enum - Single Source of Truth for Payment Types
 * 
 * Re-exports the Prisma PaymentModel enum for centralized access throughout the application.
 * This ensures consistency and prevents string literal mismatches.
 * 
 * @description Payment models define how contractors are paid:
 * - GROSS: Contractor invoices client directly (self-billing)
 * - PAYROLL: Agency pays contractor through payroll partner
 * - PAYROLL_WE_PAY: Agency pays contractor directly through payroll
 * - SPLIT: Payment is split between multiple parties/bank accounts
 * 
 * @see prisma/schema.prisma - PaymentModel enum (source of truth)
 * 
 * @example
 * ```typescript
 * import { PaymentModel } from '@/lib/constants/payment-models'
 * 
 * // Use instead of string literals
 * if (contract.paymentModel === PaymentModel.GROSS) {
 *   // Handle gross payment
 * }
 * ```
 */
import { PaymentModel } from '@prisma/client'
export { PaymentModel }

/**
 * Type guard to check if a string is a valid PaymentModel
 */
export function isPaymentModel(value: string): value is PaymentModel {
  return ['GROSS', 'PAYROLL', 'PAYROLL_WE_PAY', 'SPLIT'].includes(value);
}

/**
 * Get human-readable label for payment model
 */
export function getPaymentModelLabel(model: PaymentModel): string {
  const labels: Record<PaymentModel, string> = {
    [PaymentModel.GROSS]: "Gross (Self-Billing)",
    [PaymentModel.PAYROLL]: "Payroll (External Partner)",
    [PaymentModel.PAYROLL_WE_PAY]: "Payroll (We Pay)",
    [PaymentModel.SPLIT]: "Split Payment",
  };
  return labels[model];
}

/**
 * Get description for payment model
 */
export function getPaymentModelDescription(model: PaymentModel): string {
  const descriptions: Record<PaymentModel, string> = {
    [PaymentModel.GROSS]: "Contractor invoices client directly and handles their own billing",
    [PaymentModel.PAYROLL]: "Agency pays contractor through external payroll partner",
    [PaymentModel.PAYROLL_WE_PAY]: "Agency pays contractor directly through internal payroll",
    [PaymentModel.SPLIT]: "Payment is split between multiple parties or bank accounts",
  };
  return descriptions[model];
}
