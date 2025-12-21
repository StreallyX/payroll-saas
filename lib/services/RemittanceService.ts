/**
 * RemittanceService - Payment tracking and proof of payment system
 * 
 * This service creates remittance records to track all payment flows:
 * - When agency pays invoice → remittance for admin (payment received)
 * - When admin pays contractor → remittance (payment sent)
 * - When admin pays payroll → remittance (payment sent)
 * 
 * Purpose: Clear proof of payment at each step of the workflow
 */

import { prisma } from "@/lib/db";
import type { PaymentType, RecipientType, RemittanceStatus } from "@prisma/client";

export interface CreateRemittanceInput {
  tenantId: string;
  invoiceId?: string;
  contractId?: string;
  amount: number;
  currency?: string;
  paymentType: PaymentType;
  recipientType: RecipientType;
  recipientId: string;
  senderId: string;
  description?: string;
  notes?: string;
  status?: RemittanceStatus;
}

export class RemittanceService {
  /**
   * Create a remittance record for payment tracking
   */
  static async createRemittance(input: CreateRemittanceInput) {
    try {
      const remittance = await prisma.remittance.create({
        data: {
          tenantId: input.tenantId,
          invoiceId: input.invoiceId,
          contractId: input.contractId,
          amount: input.amount,
          currency: input.currency || "USD",
          paymentType: input.paymentType,
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          senderId: input.senderId,
          description: input.description,
          notes: input.notes,
          status: input.status || "PENDING",
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            },
          },
        },
      });

      return remittance;
    } catch (error) {
      console.error("Error creating remittance:", error);
      throw error;
    }
  }

  /**
   * Create remittance when admin receives payment from agency/client
   * Triggered when "Payment Received" is marked on an invoice
   */
  static async createPaymentReceivedRemittance({
    tenantId,
    invoiceId,
    contractId,
    amount,
    currency,
    adminUserId,
    agencyUserId,
    description,
  }: {
    tenantId: string;
    invoiceId: string;
    contractId?: string;
    amount: number;
    currency?: string;
    adminUserId: string;
    agencyUserId: string;
    description?: string;
  }) {
    return this.createRemittance({
      tenantId,
      invoiceId,
      contractId,
      amount,
      currency,
      paymentType: "RECEIVED",
      recipientType: "ADMIN",
      recipientId: adminUserId,
      senderId: agencyUserId,
      description: description || `Payment received for invoice`,
      status: "COMPLETED",
    });
  }

  /**
   * Create remittance when admin sends payment to contractor
   * Triggered when self-invoice is created or contractor is paid
   */
  static async createPaymentSentToContractorRemittance({
    tenantId,
    invoiceId,
    contractId,
    amount,
    currency,
    adminUserId,
    contractorUserId,
    description,
  }: {
    tenantId: string;
    invoiceId?: string;
    contractId?: string;
    amount: number;
    currency?: string;
    adminUserId: string;
    contractorUserId: string;
    description?: string;
  }) {
    return this.createRemittance({
      tenantId,
      invoiceId,
      contractId,
      amount,
      currency,
      paymentType: "SENT",
      recipientType: "CONTRACTOR",
      recipientId: contractorUserId,
      senderId: adminUserId,
      description: description || `Payment sent to contractor`,
      status: "PENDING",
    });
  }

  /**
   * Create remittance when admin sends payment to payroll partner
   */
  static async createPaymentSentToPayrollRemittance({
    tenantId,
    invoiceId,
    contractId,
    amount,
    currency,
    adminUserId,
    payrollUserId,
    description,
  }: {
    tenantId: string;
    invoiceId?: string;
    contractId?: string;
    amount: number;
    currency?: string;
    adminUserId: string;
    payrollUserId: string;
    description?: string;
  }) {
    return this.createRemittance({
      tenantId,
      invoiceId,
      contractId,
      amount,
      currency,
      paymentType: "SENT",
      recipientType: "PAYROLL",
      recipientId: payrollUserId,
      senderId: adminUserId,
      description: description || `Payment sent to payroll partner`,
      status: "PENDING",
    });
  }

  /**
   * Update remittance status
   */
  static async updateRemittanceStatus(
    remittanceId: string,
    status: RemittanceStatus,
    notes?: string
  ) {
    try {
      const updates: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === "COMPLETED") {
        updates.completedAt = new Date();
      }

      if (notes) {
        updates.notes = notes;
      }

      const remittance = await prisma.remittance.update({
        where: { id: remittanceId },
        data: updates,
      });

      return remittance;
    } catch (error) {
      console.error("Error updating remittance status:", error);
      throw error;
    }
  }

  /**
   * Get remittances for an invoice
   */
  static async getRemittancesByInvoice(invoiceId: string) {
    try {
      const remittances = await prisma.remittance.findMany({
        where: { invoiceId },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return remittances;
    } catch (error) {
      console.error("Error getting remittances:", error);
      throw error;
    }
  }

  /**
   * Get remittances for a user (received or sent)
   */
  static async getRemittancesForUser(userId: string, type?: "received" | "sent") {
    try {
      const where: any = {};

      if (type === "received") {
        where.recipientId = userId;
      } else if (type === "sent") {
        where.senderId = userId;
      } else {
        where.OR = [{ recipientId: userId }, { senderId: userId }];
      }

      const remittances = await prisma.remittance.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return remittances;
    } catch (error) {
      console.error("Error getting user remittances:", error);
      throw error;
    }
  }
}
