/**
 * MarginCalculationService
 * 
 * Handles margin calculations based on contract settings
 * Supports multiple payment modes: gross, payroll, payroll_we_pay, split
 */

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/db'

export enum PaymentMode {
  GROSS = 'gross',
  PAYROLL = 'payroll',
  PAYROLL_WE_PAY = 'payroll_we_pay',
  SPLIT = 'split',
}

export enum MarginPaidBy {
  CLIENT = 'client',
  AGENCY = 'agency',
  CONTRACTOR = 'contractor',
}

export interface MarginCalculationInput {
  baseAmount: number
  marginPercentage?: number
  marginAmount?: number
  marginPaidBy: MarginPaidBy
  paymentMode?: PaymentMode
}

export interface MarginCalculationResult {
  baseAmount: number
  marginAmount: number
  marginPercentage: number
  totalAmount: number
  contractorAmount: number
  clientAmount: number
  agencyAmount: number
  breakdown: {
    description: string
    amount: number
  }[]
}

export class MarginCalculationService {
  /**
   * Calculate margin and amounts based on contract settings
   */
  static calculateMargin(
    input: MarginCalculationInput
  ): MarginCalculationResult {
    const { baseAmount, marginPaidBy, paymentMode = PaymentMode.GROSS } = input

    // Determine margin amount
    let marginAmount: number
    let marginPercentage: number

    if (input.marginAmount) {
      marginAmount = input.marginAmount
      marginPercentage = (marginAmount / baseAmount) * 100
    } else if (input.marginPercentage) {
      marginPercentage = input.marginPercentage
      marginAmount = (baseAmount * marginPercentage) / 100
    } else {
      // No margin specified
      marginAmount = 0
      marginPercentage = 0
    }

    // Calculate amounts based on who pays the margin
    let totalAmount: number
    let contractorAmount: number
    let clientAmount: number
    let agencyAmount: number
    const breakdown: { description: string; amount: number }[] = []

    switch (marginPaidBy) {
      case MarginPaidBy.CLIENT:
        // Client pays the margin (added on top)
        totalAmount = baseAmount + marginAmount
        contractorAmount = baseAmount
        clientAmount = totalAmount
        agencyAmount = marginAmount
        
        breakdown.push(
          { description: 'Contractor base amount', amount: baseAmount },
          { description: 'Agency margin (paid by client)', amount: marginAmount },
          { description: 'Total invoice to client', amount: totalAmount }
        )
        break

      case MarginPaidBy.CONTRACTOR:
        // Contractor pays the margin (deducted from base)
        totalAmount = baseAmount
        contractorAmount = baseAmount - marginAmount
        clientAmount = baseAmount
        agencyAmount = marginAmount
        
        breakdown.push(
          { description: 'Total invoice to client', amount: totalAmount },
          { description: 'Agency margin (deducted from contractor)', amount: marginAmount },
          { description: 'Contractor net amount', amount: contractorAmount }
        )
        break

      case MarginPaidBy.AGENCY:
        // Agency absorbs the margin (no impact on contractor or client)
        totalAmount = baseAmount
        contractorAmount = baseAmount
        clientAmount = baseAmount
        agencyAmount = 0 // Agency doesn't earn margin, they pay it
        
        breakdown.push(
          { description: 'Total invoice to client', amount: totalAmount },
          { description: 'Contractor amount', amount: contractorAmount },
          { description: 'Agency margin absorbed', amount: marginAmount }
        )
        break

      default:
        throw new Error(`Unknown marginPaidBy: ${marginPaidBy}`)
    }

    // Adjust based on payment mode
    if (paymentMode === PaymentMode.PAYROLL || paymentMode === PaymentMode.PAYROLL_WE_PAY) {
      // For payroll modes, additional calculations might be needed
      // (e.g., tax withholding, employer contributions)
      // This can be extended based on specific requirements
    }

    return {
      baseAmount,
      marginAmount,
      marginPercentage,
      totalAmount,
      contractorAmount,
      clientAmount,
      agencyAmount,
      breakdown,
    }
  }

  /**
   * Calculate margin from contract data
   */
  static async calculateMarginFromContract(
    contractId: string,
    baseAmount: number
  ): Promise<MarginCalculationResult | null> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        margin: true,
        marginType: true,
        marginPaidBy: true,
        payrollModes: true,
      },
    })

    if (!contract) {
      return null
    }

    // Determine margin
    const marginPercentage = contract.margin
      ? parseFloat(contract.margin.toString())
      : undefined
    const marginPaidBy = (contract.marginPaidBy as MarginPaidBy) || MarginPaidBy.CLIENT
    const paymentMode = contract.payrollModes?.[0] as PaymentMode | undefined

    return this.calculateMargin({
      baseAmount,
      marginPercentage,
      marginPaidBy,
      paymentMode,
    })
  }

  /**
   * Update invoice with margin calculation
   */
  static async applyMarginToInvoice(
    invoiceId: string,
    calculation: MarginCalculationResult
  ): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        baseAmount: new Decimal(calculation.baseAmount),
        marginAmount: new Decimal(calculation.marginAmount),
        marginPercentage: new Decimal(calculation.marginPercentage),
        totalAmount: new Decimal(calculation.totalAmount),
      },
    })
  }

  /**
   * Validate margin configuration
   */
  static validateMarginConfig(
    input: MarginCalculationInput
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (input.baseAmount <= 0) {
      errors.push('Base amount must be greater than 0')
    }

    if (input.marginPercentage && (input.marginPercentage < 0 || input.marginPercentage > 100)) {
      errors.push('Margin percentage must be between 0 and 100')
    }

    if (input.marginAmount && input.marginAmount < 0) {
      errors.push('Margin amount must be non-negative')
    }

    if (!Object.values(MarginPaidBy).includes(input.marginPaidBy)) {
      errors.push('Invalid marginPaidBy value')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get margin summary for reporting
   */
  static getMarginSummary(calculation: MarginCalculationResult): string {
    const lines = [
      `Base Amount: $${calculation.baseAmount.toFixed(2)}`,
      `Margin: ${calculation.marginPercentage.toFixed(2)}% ($${calculation.marginAmount.toFixed(2)})`,
      `Total: $${calculation.totalAmount.toFixed(2)}`,
      '',
      'Breakdown:',
      ...calculation.breakdown.map(
        (item) => `  ${item.description}: $${item.amount.toFixed(2)}`
      ),
    ]

    return lines.join('\n')
  }
}
