// Invoice Status
export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

// Invoice Form Data
export interface InvoiceFormData {
  contractId: string;
  invoiceNumber?: string;
  status?: InvoiceStatus | string;
  
  // Financial
  amount: number;
  currency?: string;
  taxAmount?: number;
  totalAmount: number;
  
  // Dates
  issueDate: Date | string;
  dueDate: Date | string;
  paidDate?: Date | string;
  sentDate?: Date | string;
  
  // Details
  description?: string;
  notes?: string;
  
  // Line Items
  lineItems?: InvoiceLineItemData[];
}

// Invoice Line Item Data
export interface InvoiceLineItemData {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Invoice with Relations
export interface InvoiceWithRelations {
  id: string;
  tenantId: string;
  contractId: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  issueDate: Date | string;
  dueDate: Date | string;
  paidDate?: Date | string;
  sentDate?: Date | string;
  description?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Relations
  contract?: {
    id: string;
    title?: string;
    contractor?: {
      id: string;
      name?: string;
      email?: string;
      user?: {
        name?: string;
        email?: string;
      };
    };
    agency?: {
      id: string;
      name: string;
    };
    company?: {
      id: string;
      name: string;
    };
  };
  lineItems?: InvoiceLineItemData[];
}

// Helper function to generate invoice number
export function generateInvoiceNumber(date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `INV-${year}${month}-${timestamp}`;
}

// Helper function to calculate due date
export function calculateDueDate(issueDate: Date, dueDays: number = 30): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate;
}

// Helper function to check if invoice is overdue
export function isInvoiceOverdue(dueDate: Date | string, status: string): boolean {
  if (status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED) {
    return false;
  }
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return due < new Date();
}

// Helper function to get invoice status label
export function getInvoiceStatusLabel(status: InvoiceStatus | string): string {
  const labels: Record<string, string> = {
    [InvoiceStatus.DRAFT]: "Draft",
    [InvoiceStatus.SENT]: "Sent",
    [InvoiceStatus.PAID]: "Paid",
    [InvoiceStatus.OVERDUE]: "Overdue",
    [InvoiceStatus.CANCELLED]: "Cancelled",
  };
  return labels[status] || status;
}

// Helper function to get invoice status color
export function getInvoiceStatusColor(status: InvoiceStatus | string): string {
  const colors: Record<string, string> = {
    [InvoiceStatus.DRAFT]: "bg-gray-100 text-gray-800",
    [InvoiceStatus.SENT]: "bg-blue-100 text-blue-800",
    [InvoiceStatus.PAID]: "bg-green-100 text-green-800",
    [InvoiceStatus.OVERDUE]: "bg-red-100 text-red-800",
    [InvoiceStatus.CANCELLED]: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Calculate line item amount
export function calculateLineItemAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

// Calculate invoice total
export function calculateInvoiceTotal(amount: number, taxAmount: number = 0): number {
  return amount + taxAmount;
}

// Auto-update invoice status based on dates
export function getAutoInvoiceStatus(
  currentStatus: string,
  dueDate: Date | string,
  paidDate?: Date | string
): InvoiceStatus {
  if (paidDate) {
    return InvoiceStatus.PAID;
  }
  
  if (currentStatus === InvoiceStatus.DRAFT || currentStatus === InvoiceStatus.CANCELLED) {
    return currentStatus as InvoiceStatus;
  }
  
  if (isInvoiceOverdue(dueDate, currentStatus)) {
    return InvoiceStatus.OVERDUE;
  }
  
  return currentStatus as InvoiceStatus;
}
