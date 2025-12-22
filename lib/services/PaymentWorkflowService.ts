/**
 * PaymentWorkflowService
 * 
 * Executes payment workflows based on payment model:
 * - GROSS: Mark as complete, worker handles taxes
 * - PAYROLL: Create task to send to payroll provider
 * - PAYROLL_WE_PAY: Create internal payroll tasks, track all fees
 * - SPLIT: Handle split payments, create multiple payment records
 */

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/db'
import { PaymentModel } from '@/lib/constants/payment-models'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, AuditEntityType } from '@/lib/types'

export interface PaymentWorkflowContext {
  invoiceId: string
  paymentModel: PaymentModel
  userId: string
  tenantId: string
  metadata?: Record<string, any>
}

export interface PaymentWorkflowResult {
  success: boolean
  paymentIds: string[]
  tasks: Array<{
    id: string
    type: string
    status: string
    description: string
  }>
  message: string
  nextSteps: string[]
}

export class PaymentWorkflowService {
  /**
   * Execute payment workflow based on payment model
   */
  static async executePaymentWorkflow(
    context: PaymentWorkflowContext
  ): Promise<PaymentWorkflowResult> {
    const { invoiceId, paymentModel, userId, tenantId, metadata } = context

    // Load invoice with full details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            participants: {
              include: {
                user: true,
                company: true,
              },
            },
          },
        },
        lineItems: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Route to appropriate workflow handler
    switch (paymentModel) {
      case PaymentModel.gross:
        return this.executeGrossPaymentWorkflow(invoice, userId, tenantId, metadata)

      case PaymentModel.payroll:
        return this.executePayrollWorkflow(invoice, userId, tenantId, metadata)

      case PaymentModel.payroll_we_pay:
        return this.executePayrollWePayWorkflow(invoice, userId, tenantId, metadata)

      case PaymentModel.split:
        return this.executeSplitPaymentWorkflow(invoice, userId, tenantId, metadata)

      default:
        throw new Error(`Unknown payment model: ${paymentModel}`)
    }
  }

  /**
   * GROSS Payment Workflow
   * Worker receives full payment and handles their own taxes
   */
  private static async executeGrossPaymentWorkflow(
    invoice: any,
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentWorkflowResult> {
    // Create single payment record for full amount
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        status: 'pending',
        paymentMethod: metadata?.paymentMethod || 'bank_transfer',
        scheduledDate: new Date(),
        description: `Gross payment for invoice ${invoice.invoiceNumber || invoice.id}`,
        notes: 'Worker is responsible for tax withholding and reporting',
        createdBy: userId,
        metadata: {
          paymentModel: PaymentModel.gross,
          workerHandlesTaxes: true,
          ...metadata,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId,
      userName: metadata?.userName || 'System',
      userRole: metadata?.userRole || 'admin',
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: payment.id,
      entityName: `Payment ${payment.id}`,
      tenantId,
      description: 'Gross payment workflow initiated',
      metadata: {
        invoiceId: invoice.id,
        paymentModel: PaymentModel.gross,
      },
    })

    return {
      success: true,
      paymentIds: [payment.id],
      tasks: [],
      message: 'Gross payment created. Worker will handle tax obligations.',
      nextSteps: [
        'Process payment to worker',
        'Worker is responsible for tax withholding',
        'Worker will file and pay their own taxes',
      ],
    }
  }

  /**
   * PAYROLL Payment Workflow
   * Send to external payroll provider (e.g., ADP, Gusto)
   */
  private static async executePayrollWorkflow(
    invoice: any,
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentWorkflowResult> {
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        status: 'pending_payroll_submission',
        paymentMethod: 'payroll_provider',
        scheduledDate: new Date(),
        description: `Payroll provider payment for invoice ${invoice.invoiceNumber || invoice.id}`,
        notes: 'Payment will be processed through external payroll provider',
        createdBy: userId,
        metadata: {
          paymentModel: PaymentModel.payroll,
          payrollProvider: metadata?.payrollProvider || 'external',
          ...metadata,
        },
      },
    })

    // Create task for payroll submission
    // Note: This would integrate with your task management system
    const taskDescription = `Submit payment to payroll provider for invoice ${invoice.invoiceNumber || invoice.id}`

    await createAuditLog({
      userId,
      userName: metadata?.userName || 'System',
      userRole: metadata?.userRole || 'admin',
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: payment.id,
      entityName: `Payment ${payment.id}`,
      tenantId,
      description: 'Payroll provider workflow initiated',
      metadata: {
        invoiceId: invoice.id,
        paymentModel: PaymentModel.payroll,
        taskDescription,
      },
    })

    return {
      success: true,
      paymentIds: [payment.id],
      tasks: [
        {
          id: payment.id,
          type: 'PAYROLL_SUBMISSION',
          status: 'pending',
          description: taskDescription,
        },
      ],
      message: 'Payment queued for payroll provider submission.',
      nextSteps: [
        'Export payment data to payroll provider format',
        'Submit to payroll provider (ADP, Gusto, etc.)',
        'Track payroll provider confirmation',
        'Monitor payment completion',
      ],
    }
  }

  /**
   * PAYROLL_WE_PAY Payment Workflow
   * Internal payroll processing with tax withholding
   */
  private static async executePayrollWePayWorkflow(
    invoice: any,
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentWorkflowResult> {
    const grossAmount = invoice.totalAmount

    // Calculate tax withholdings (simplified - in production, use proper tax service)
    const federalTaxRate = metadata?.federalTaxRate || 0.22 // 22% default
    const stateTaxRate = metadata?.stateTaxRate || 0.05 // 5% default
    const ficaRate = 0.0765 // 7.65% (Social Security + Medicare)

    const federalTax = grossAmount.mul(federalTaxRate)
    const stateTax = grossAmount.mul(stateTaxRate)
    const fica = grossAmount.mul(ficaRate)
    const totalWithholding = federalTax.add(stateTax).add(fica)
    const netAmount = grossAmount.sub(totalWithholding)

    // Create main payment record for net amount
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        amount: netAmount,
        currency: invoice.currency,
        status: 'pending_processing',
        paymentMethod: 'internal_payroll',
        scheduledDate: new Date(),
        description: `Internal payroll payment for invoice ${invoice.invoiceNumber || invoice.id}`,
        notes: `Gross: ${grossAmount}, Withholding: ${totalWithholding}, Net: ${netAmount}`,
        createdBy: userId,
        metadata: {
          paymentModel: PaymentModel.payroll_we_pay,
          grossAmount: grossAmount.toString(),
          federalTax: federalTax.toString(),
          stateTax: stateTax.toString(),
          fica: fica.toString(),
          totalWithholding: totalWithholding.toString(),
          netAmount: netAmount.toString(),
          ...metadata,
        },
      },
    })

    // Create tasks for internal payroll processing
    const tasks = [
      {
        id: `${payment.id}-net-payment`,
        type: 'NET_PAYMENT_PROCESSING',
        status: 'pending',
        description: `Process net payment of ${netAmount} ${invoice.currency} to worker`,
      },
      {
        id: `${payment.id}-tax-withholding`,
        type: 'TAX_WITHHOLDING',
        status: 'pending',
        description: `Withhold and remit taxes: Federal ${federalTax}, State ${stateTax}, FICA ${fica}`,
      },
      {
        id: `${payment.id}-tax-filing`,
        type: 'TAX_FILING',
        status: 'pending',
        description: 'File required tax forms (W-2, 941, etc.)',
      },
    ]

    await createAuditLog({
      userId,
      userName: metadata?.userName || 'System',
      userRole: metadata?.userRole || 'admin',
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: payment.id,
      entityName: `Payment ${payment.id}`,
      tenantId,
      description: 'Internal payroll workflow initiated',
      metadata: {
        invoiceId: invoice.id,
        paymentModel: PaymentModel.payroll_we_pay,
        grossAmount: grossAmount.toString(),
        netAmount: netAmount.toString(),
        totalWithholding: totalWithholding.toString(),
      },
    })

    return {
      success: true,
      paymentIds: [payment.id],
      tasks,
      message: `Internal payroll processing initiated. Net payment: ${netAmount} ${invoice.currency}`,
      nextSteps: [
        'Process net payment to worker',
        'Calculate and withhold all taxes',
        'Remit taxes to federal and state authorities',
        'File required tax forms (W-2, 941, etc.)',
        'Maintain payroll records',
      ],
    }
  }

  /**
   * SPLIT Payment Workflow
   * Split payment between multiple parties (e.g., contractor + subcontractors)
   */
  private static async executeSplitPaymentWorkflow(
    invoice: any,
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentWorkflowResult> {
    const totalAmount = invoice.totalAmount
    const splits = metadata?.splits as Array<{
      userId?: string
      companyId?: string
      percentage?: number
      amount?: number
      description: string
    }> || []

    if (splits.length === 0) {
      throw new Error('Split payment requires split configuration')
    }

    // Validate splits
    let totalPercentage = 0
    let totalSplitAmount = new Decimal(0)

    for (const split of splits) {
      if (split.percentage) {
        totalPercentage += split.percentage
      }
      if (split.amount) {
        totalSplitAmount = totalSplitAmount.add(split.amount)
      }
    }

    // Calculate split amounts
    const paymentIds: string[] = []
    const tasks: Array<{ id: string; type: string; status: string; description: string }> = []

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i]
      let splitAmount: Decimal

      if (split.amount) {
        splitAmount = new Decimal(split.amount)
      } else if (split.percentage) {
        splitAmount = totalAmount.mul(split.percentage).div(100)
      } else {
        throw new Error('Each split must have either amount or percentage')
      }

      // Create payment record for each split
      const payment = await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: splitAmount,
          currency: invoice.currency,
          status: 'pending',
          paymentMethod: metadata?.paymentMethod || 'bank_transfer',
          scheduledDate: new Date(),
          description: `Split payment ${i + 1}/${splits.length}: ${split.description}`,
          notes: `Part of split payment for invoice ${invoice.invoiceNumber || invoice.id}`,
          createdBy: userId,
          metadata: {
            paymentModel: PaymentModel.split,
            splitIndex: i + 1,
            totalSplits: splits.length,
            splitPercentage: split.percentage,
            splitUserId: split.userId,
            splitCompanyId: split.companyId,
            ...metadata,
          },
        },
      })

      paymentIds.push(payment.id)

      tasks.push({
        id: payment.id,
        type: 'SPLIT_PAYMENT',
        status: 'pending',
        description: `Process payment ${i + 1}: ${splitAmount} ${invoice.currency} - ${split.description}`,
      })
    }

    await createAuditLog({
      userId,
      userName: metadata?.userName || 'System',
      userRole: metadata?.userRole || 'admin',
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: paymentIds[0],
      entityName: `Split Payments`,
      tenantId,
      description: 'Split payment workflow initiated',
      metadata: {
        invoiceId: invoice.id,
        paymentModel: PaymentModel.split,
        totalAmount: totalAmount.toString(),
        splitCount: splits.length,
        paymentIds,
      },
    })

    return {
      success: true,
      paymentIds,
      tasks,
      message: `Split payment created with ${splits.length} payment records.`,
      nextSteps: [
        `Process ${splits.length} separate payments`,
        'Track each payment independently',
        'Verify all splits are completed',
        'Mark invoice as fully paid when all splits are processed',
      ],
    }
  }

  /**
   * Get payment workflow status
   */
  static async getPaymentWorkflowStatus(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        contract: {
          select: {
            paymentModel: true,
          },
        },
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // 🔥 REFACTOR: Use contract's paymentModel as single source of truth
    const paymentModel = invoice.contract?.paymentModel

    return {
      invoiceId: invoice.id,
      paymentModel,
      totalAmount: invoice.totalAmount,
      payments: invoice.payments,
      allPaymentsCompleted: invoice.payments.every((p) => p.status === 'completed'),
      pendingPayments: invoice.payments.filter((p) => p.status === 'pending').length,
      completedPayments: invoice.payments.filter((p) => p.status === 'completed').length,
    }
  }
}
