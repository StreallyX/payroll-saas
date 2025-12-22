/**
 * Enum Helper Utilities
 * 
 * Provides case-insensitive comparison and normalization functions for Prisma enums.
 * This ensures compatibility with legacy data that may have different casing.
 */

import { PaymentModel, MarginType, BankAccountUsage } from '@prisma/client'

/**
 * Normalize a string to a PaymentModel enum value (case-insensitive)
 */
export function normalizePaymentModel(value: string | PaymentModel | null | undefined): PaymentModel | null {
  if (!value) return null
  
  // If already a valid enum value, return it
  if (Object.values(PaymentModel).includes(value as PaymentModel)) {
    return value as PaymentModel
  }
  
  // Case-insensitive matching
  const normalized = value.toString().toLowerCase()
  switch (normalized) {
    case 'gross':
      return PaymentModel.gross
    case 'payroll':
      return PaymentModel.payroll
    case 'payroll_we_pay':
    case 'payrollwepay':
      return PaymentModel.payroll_we_pay
    case 'split':
      return PaymentModel.split
    default:
      console.warn(`Unknown payment model: ${value}`)
      return null
  }
}

/**
 * Normalize a string to a MarginType enum value (case-insensitive)
 */
export function normalizeMarginType(value: string | MarginType | null | undefined): MarginType | null {
  if (!value) return null
  
  // If already a valid enum value, return it
  if (Object.values(MarginType).includes(value as MarginType)) {
    return value as MarginType
  }
  
  // Case-insensitive matching
  const normalized = value.toString().toLowerCase()
  switch (normalized) {
    case 'fixed':
      return MarginType.fixed
    case 'variable':
    case 'percentage': // Handle legacy 'percentage' value
      return MarginType.variable
    case 'custom':
      return MarginType.custom
    default:
      console.warn(`Unknown margin type: ${value}`)
      return MarginType.variable // Default to variable
  }
}

/**
 * Normalize a string to a BankAccountUsage enum value (case-insensitive)
 */
export function normalizeBankAccountUsage(value: string | BankAccountUsage | null | undefined): BankAccountUsage | null {
  if (!value) return null
  
  // If already a valid enum value, return it
  if (Object.values(BankAccountUsage).includes(value as BankAccountUsage)) {
    return value as BankAccountUsage
  }
  
  // Case-insensitive matching
  const normalized = value.toString().toLowerCase()
  switch (normalized) {
    case 'salary':
      return BankAccountUsage.salary
    case 'gross':
      return BankAccountUsage.gross
    case 'expenses':
      return BankAccountUsage.expenses
    case 'other':
      return BankAccountUsage.other
    default:
      console.warn(`Unknown bank account usage: ${value}`)
      return null
  }
}

/**
 * Compare enum values in a case-insensitive manner
 */
export function enumEquals<T extends string>(
  value1: T | string | null | undefined,
  value2: T | string | null | undefined
): boolean {
  if (!value1 || !value2) return value1 === value2
  return value1.toString().toLowerCase() === value2.toString().toLowerCase()
}
