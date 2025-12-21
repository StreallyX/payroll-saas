// lib/constants/bank-usage.ts
import type { BankAccountUsage } from "@prisma/client";

/**
 * Human-readable labels for bank account usage types
 */
export const BANK_USAGE_LABELS: Record<BankAccountUsage, string> = {
  SALARY: "Salary",
  GROSS: "Gross",
  EXPENSES: "Expenses",
  OTHER: "Other",
};

/**
 * Descriptions for bank account usage types
 */
export const BANK_USAGE_DESCRIPTIONS: Record<BankAccountUsage, string> = {
  SALARY: "For receiving salary payments",
  GROSS: "For receiving gross amount payments",
  EXPENSES: "For expense reimbursements",
  OTHER: "For other payment purposes",
};

/**
 * Get bank accounts by usage type from a list of accounts
 * @param accounts - List of bank accounts
 * @param usage - Usage type to filter by
 * @returns Filtered list of bank accounts
 */
export function getBankAccountsByUsage(
  accounts: Array<{ usage?: BankAccountUsage | null }>,
  usage: BankAccountUsage
) {
  return accounts.filter((account) => account.usage === usage);
}

/**
 * Get primary bank account from a list of accounts
 * @param accounts - List of bank accounts
 * @returns Primary bank account or first account if no primary is set
 */
export function getPrimaryBankAccount<T extends { isPrimary?: boolean }>(
  accounts: T[]
): T | undefined {
  const primary = accounts.find((account) => account.isPrimary);
  return primary || accounts[0];
}

/**
 * Get primary bank account for a specific usage type
 * @param accounts - List of bank accounts
 * @param usage - Usage type to filter by
 * @returns Primary bank account for the usage type
 */
export function getPrimaryBankAccountByUsage<
  T extends { usage?: BankAccountUsage | null; isPrimary?: boolean }
>(accounts: T[], usage: BankAccountUsage): T | undefined {
  const filtered = accounts.filter((account) => account.usage === usage);
  return getPrimaryBankAccount(filtered);
}
