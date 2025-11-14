export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

export type ExpenseFormData = Omit<Expense, 'id' | 'date'> & {
  date: string
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
] as const

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// Audit Log Types and Enums
export enum AuditAction {
  // CRUD Operations
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  
  // Specific Actions
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  GENERATE = "GENERATE",
  SEND = "SEND",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ACTIVATE = "ACTIVATE",
  DEACTIVATE = "DEACTIVATE",
  
  // Auth
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE"
}

export enum AuditEntityType {
  LEAD = "LEAD",
  CONTRACT = "CONTRACT",
  CONTRACTOR = "CONTRACTOR",
  AGENCY = "AGENCY",
  USER = "USER",
  INVOICE = "INVOICE",
  PAYSLIP = "PAYSLIP",
  PAYROLL_PARTNER = "PAYROLL_PARTNER",
  ONBOARDING = "ONBOARDING",
  TASK = "TASK",
  DOCUMENT = "DOCUMENT",
  SETTINGS = "SETTINGS",
  ROLE = "ROLE",
  COMPANY = "COMPANY",
  BANK = "BANK",
  CURRENCY = "CURRENCY",
  COUNTRY = "COUNTRY",
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
  TENANT = "TENANT",
  ONBOARDING_TEMPLATE = "ONBOARDING_TEMPLATE",
  ONBOARDING_RESPONSE = "ONBOARDING_RESPONSE"
}

export type AuditLogInput = {
  userId: string
  userName: string
  userRole: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  entityName?: string
  description?: string
  metadata?: Record<string, any>
  tenantId?: string
  ipAddress?: string
  userAgent?: string
}