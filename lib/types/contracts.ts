
export enum ContractWorkflowStatus {
  DRAFT = "draft",
  PENDING_AGENCY_SIGN = "pending_agency_sign",
  PENDING_CONTRACTOR_SIGN = "pending_contractor_sign",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  TERMINATED = "terminated",
}

export enum ContractRateType {
  HOURLY = "hourly",
  DAILY = "daily",
  MONTHLY = "monthly",
  FIXED = "fixed",
}

export enum ContractSalaryType {
  GROSS = "gross",
  NET = "net",
}

export enum ContractMarginType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export enum ContractMarginPaidBy {
  CLIENT = "client",
  CONTRACTOR = "contractor",
}

export interface ContractFormData {
  // Basic Info
  title: string;
  description?: string;
  notes?: string;

  // Parties
  companyId?: string;
  agencyId: string;
  contractorId: string;
  payrollPartnerId: string;

  // Financial
  rate?: number;
  rateType?: ContractRateType;
  currencyId?: string;
  rateCycle?: string;
  margin?: number;
  marginType?: ContractMarginType;
  marginPaidBy?: ContractMarginPaidBy;
  salaryType?: ContractSalaryType;

  // Bank & Invoice
  bankId?: string;
  invoiceDueDays?: number;

  // Contract Details
  contractReference?: string;
  contractCountryId?: string;
  contractVatRate?: number;

  // Dates
  startDate?: Date;
  endDate?: Date;

  // Status
  status?: string;
  workflowStatus?: ContractWorkflowStatus;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  version: number;
  isActive: boolean;
}

export interface ContractStatusHistoryEntry {
  id: string;
  contractId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  metadata?: any;
}

export interface ContractNotificationData {
  id: string;
  contractId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  sentAt: Date;
  readAt?: Date;
}
