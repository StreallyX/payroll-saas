// Contract Workflow Status
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

// Contract Status (Legacy)
export enum ContractStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Rate Types
export enum ContractRateType {
  HOURLY = "hourly",
  DAILY = "daily",
  MONTHLY = "monthly",
  FIXED = "fixed",
}

// Salary Types
export enum ContractSalaryType {
  GROSS = "gross",
  NET = "net",
}

// Margin Types
export enum ContractMarginType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

// Margin Paid By
export enum ContractMarginPaidBy {
  CLIENT = "client",
  CONTRACTOR = "contractor",
}

// Document Types
export enum ContractDocumentType {
  CONTRACT = "contract",
  AMENDMENT = "amendment",
  TERMINATION = "termination",
  OTHER = "other",
}

// Notification Types
export enum ContractNotificationType {
  SIGNATURE_REQUEST = "signature_request",
  RENEWAL_REMINDER = "renewal_reminder",
  TERMINATION_NOTICE = "termination_notice",
  STATUS_CHANGE = "status_change",
  EXPIRATION_WARNING = "expiration_warning",
}

// Contract Form Data
export interface ContractFormData {
  // Basic Info
  title?: string;
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
  startDate?: Date | string;
  endDate?: Date | string;
  agencySignDate?: Date | string;
  contractorSignDate?: Date | string;

  // Status
  status?: string;
  workflowStatus?: ContractWorkflowStatus;

  // Document
  signedContractPath?: string;
}

// Contract Document
export interface ContractDocument {
  id: string;
  contractId: string;
  type: ContractDocumentType | string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isActive: boolean;
  uploadedBy: string;
  uploadedAt: Date | string;
}

// Contract Status History Entry
export interface ContractStatusHistoryEntry {
  id: string;
  contractId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy: string;
  changedAt: Date | string;
  reason?: string;
  metadata?: any;
}

// Contract Notification
export interface ContractNotificationData {
  id: string;
  contractId: string;
  recipientId: string;
  type: ContractNotificationType | string;
  title: string;
  message: string;
  sentAt: Date | string;
  readAt?: Date | string;
}

// Workflow Transition
export interface WorkflowTransition {
  from: ContractWorkflowStatus[];
  to: ContractWorkflowStatus;
  requiredFields?: string[];
}

// Workflow Transitions Map
export const WORKFLOW_TRANSITIONS: Record<ContractWorkflowStatus, ContractWorkflowStatus[]> = {
  [ContractWorkflowStatus.DRAFT]: [
    ContractWorkflowStatus.PENDING_AGENCY_SIGN,
    ContractWorkflowStatus.CANCELLED,
  ],
  [ContractWorkflowStatus.PENDING_AGENCY_SIGN]: [
    ContractWorkflowStatus.PENDING_CONTRACTOR_SIGN,
    ContractWorkflowStatus.CANCELLED,
    ContractWorkflowStatus.DRAFT,
  ],
  [ContractWorkflowStatus.PENDING_CONTRACTOR_SIGN]: [
    ContractWorkflowStatus.ACTIVE,
    ContractWorkflowStatus.CANCELLED,
    ContractWorkflowStatus.PENDING_AGENCY_SIGN,
  ],
  [ContractWorkflowStatus.ACTIVE]: [
    ContractWorkflowStatus.PAUSED,
    ContractWorkflowStatus.COMPLETED,
    ContractWorkflowStatus.TERMINATED,
  ],
  [ContractWorkflowStatus.PAUSED]: [
    ContractWorkflowStatus.ACTIVE,
    ContractWorkflowStatus.TERMINATED,
  ],
  [ContractWorkflowStatus.COMPLETED]: [],
  [ContractWorkflowStatus.CANCELLED]: [],
  [ContractWorkflowStatus.TERMINATED]: [],
};

// Helper function to check if transition is valid
export function isValidTransition(
  from: ContractWorkflowStatus,
  to: ContractWorkflowStatus
): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

// Helper function to get workflow status label
export function getWorkflowStatusLabel(status: ContractWorkflowStatus | string): string {
  const labels: Record<string, string> = {
    [ContractWorkflowStatus.DRAFT]: "Draft",
    [ContractWorkflowStatus.PENDING_AGENCY_SIGN]: "Pending Agency Signature",
    [ContractWorkflowStatus.PENDING_CONTRACTOR_SIGN]: "Pending Contractor Signature",
    [ContractWorkflowStatus.ACTIVE]: "Active",
    [ContractWorkflowStatus.PAUSED]: "Paused",
    [ContractWorkflowStatus.COMPLETED]: "Completed",
    [ContractWorkflowStatus.CANCELLED]: "Cancelled",
    [ContractWorkflowStatus.TERMINATED]: "Terminated",
  };
  return labels[status] || status;
}

// Helper function to get workflow status color
export function getWorkflowStatusColor(status: ContractWorkflowStatus | string): string {
  const colors: Record<string, string> = {
    [ContractWorkflowStatus.DRAFT]: "bg-gray-100 text-gray-800",
    [ContractWorkflowStatus.PENDING_AGENCY_SIGN]: "bg-yellow-100 text-yellow-800",
    [ContractWorkflowStatus.PENDING_CONTRACTOR_SIGN]: "bg-orange-100 text-orange-800",
    [ContractWorkflowStatus.ACTIVE]: "bg-green-100 text-green-800",
    [ContractWorkflowStatus.PAUSED]: "bg-blue-100 text-blue-800",
    [ContractWorkflowStatus.COMPLETED]: "bg-purple-100 text-purple-800",
    [ContractWorkflowStatus.CANCELLED]: "bg-red-100 text-red-800",
    [ContractWorkflowStatus.TERMINATED]: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
