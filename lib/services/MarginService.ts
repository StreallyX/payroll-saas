/**
 * MarginService
 * 
 * Handles margin operations for invoices using the new Margin table
 * Supports FIXED, VARIABLE, and CUSTOM margin types
 * Provides margin override and history tracking
 */

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/db'
import { MarginType, PaymentModel } from '@prisma/client'

export interface MarginCalculationInput {
  invoiceAmount: number
  contractId: string
  marginType?: MarginType
  marginPercentage?: number
  marginAmount?: number
}

export interface MarginCalculationResult {
  marginType: MarginType
  marginPercentage: Decimal
  marginAmount: Decimal
  calculatedMargin: Decimal
  invoiceAmount: Decimal
  totalWithMargin: Decimal
}

export interface MarginOverrideInput {
  marginId: string
  newMarginAmount?: number
  newMarginPercentage?: number
  userId: string
  notes: string
}

export class MarginService {
  /**
   * Calculate margin from contract settings
   * Loads contract margin configuration and calculates based on invoice amount
   */
  static async calculateMarginFromContract(
    contractId: string,
    invoiceAmount: number
  ): Promise<MarginCalculationResult | null> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        margin: true,
        marginType: true,
        marginPaidBy: true,
      },
    })

    if (!contract) {
      return null
    }

    const marginType = (contract.marginType as MarginType) || MarginType.VARIABLE
    const marginValue = contract.margin ? parseFloat(contract.margin.toString()) : 0
    const invoiceAmountDecimal = new Decimal(invoiceAmount)

    let marginAmount: Decimal
    let marginPercentage: Decimal

    // Calculate based on margin type
    switch (marginType) {
      case MarginType.FIXED:
        // Fixed amount margin
        marginAmount = new Decimal(marginValue)
        marginPercentage = invoiceAmountDecimal.gt(0)
          ? marginAmount.div(invoiceAmountDecimal).mul(100)
          : new Decimal(0)
        break

      case MarginType.VARIABLE:
        // Percentage-based margin
        marginPercentage = new Decimal(marginValue)
        marginAmount = invoiceAmountDecimal.mul(marginPercentage).div(100)
        break

      case MarginType.CUSTOM:
        // Custom margin (will be manually set)
        marginAmount = new Decimal(0)
        marginPercentage = new Decimal(0)
        break

      default:
        marginAmount = new Decimal(0)
        marginPercentage = new Decimal(0)
    }

    const calculatedMargin = marginAmount
    const totalWithMargin = invoiceAmountDecimal.add(marginAmount)

    return {
      marginType,
      marginPercentage,
      marginAmount,
      calculatedMargin,
      invoiceAmount: invoiceAmountDecimal,
      totalWithMargin,
    }
  }

  /**
   * Create margin entry for invoice
   * Links margin to both invoice and contract
   */
  static async createMarginForInvoice(
    invoiceId: string,
    contractId: string,
    marginData: {
      marginType: MarginType
      marginPercentage: Decimal
      marginAmount: Decimal
      calculatedMargin: Decimal
    }
  ) {
    // Check if margin already exists
    const existing = await prisma.margin.findUnique({
      where: { invoiceId },
    })

    if (existing) {
      throw new Error('Margin already exists for this invoice')
    }

    return prisma.margin.create({
      data: {
        invoiceId,
        contractId,
        marginType: marginData.marginType,
        marginPercentage: marginData.marginPercentage,
        marginAmount: marginData.marginAmount,
        calculatedMargin: marginData.calculatedMargin,
        isOverridden: false,
      },
      include: {
        invoice: true,
        contract: true,
      },
    })
  }

  /**
   * Override margin value
   * Allows admin to manually adjust margin with audit trail
   */
  static async overrideMargin(
    marginId: string,
    overrideData: {
      newMarginAmount?: number
      newMarginPercentage?: number
      userId: string
      notes: string
    }
  ) {
    const margin = await prisma.margin.findUnique({
      where: { id: marginId },
      include: { invoice: true },
    })

    if (!margin) {
      throw new Error('Margin not found')
    }

    const updateData: any = {
      isOverridden: true,
      overriddenBy: overrideData.userId,
      overriddenAt: new Date(),
      notes: overrideData.notes,
    }

    // Calculate new margin values
    const invoiceAmount = margin.invoice.amount
    let newMarginAmount: Decimal
    let newMarginPercentage: Decimal

    if (overrideData.newMarginAmount !== undefined) {
      // Override with fixed amount
      newMarginAmount = new Decimal(overrideData.newMarginAmount)
      newMarginPercentage = invoiceAmount.gt(0)
        ? newMarginAmount.div(invoiceAmount).mul(100)
        : new Decimal(0)
      updateData.marginAmount = newMarginAmount
      updateData.marginPercentage = newMarginPercentage
      updateData.marginType = 'CUSTOM' as MarginType
    } else if (overrideData.newMarginPercentage !== undefined) {
      // Override with percentage
      newMarginPercentage = new Decimal(overrideData.newMarginPercentage)
      newMarginAmount = invoiceAmount.mul(newMarginPercentage).div(100)
      updateData.marginAmount = newMarginAmount
      updateData.marginPercentage = newMarginPercentage
      updateData.marginType = 'CUSTOM' as MarginType
    }

    // Update margin
    const updatedMargin = await prisma.margin.update({
      where: { id: marginId },
      data: updateData,
      include: {
        invoice: true,
        contract: true,
        overriddenByUser: true,
      },
    })

    // Update invoice total amount with new margin
    if (updateData.marginAmount) {
      const newTotal = invoiceAmount.add(updateData.marginAmount)
      await prisma.invoice.update({
        where: { id: margin.invoiceId },
        data: {
          marginAmount: updateData.marginAmount,
          marginPercentage: updateData.marginPercentage,
          totalAmount: newTotal,
        },
      })
    }

    return updatedMargin
  }

  /**
   * Get margin by invoice ID
   */
  static async getMarginByInvoiceId(invoiceId: string) {
    return prisma.margin.findUnique({
      where: { invoiceId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            totalAmount: true,
            status: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractReference: true,
            margin: true,
            marginType: true,
          },
        },
        overriddenByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Get margin history for an invoice
   * Returns all margin changes and overrides
   */
  static async getMarginHistory(invoiceId: string) {
    const margin = await prisma.margin.findUnique({
      where: { invoiceId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractReference: true,
          },
        },
        overriddenByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!margin) {
      return null
    }

    // Build history timeline
    const history: Array<{
      timestamp: Date
      action: string
      actor?: { id: string; name: string | null; email: string }
      details: Record<string, any>
    }> = []

    // Initial margin creation
    history.push({
      timestamp: margin.createdAt,
      action: 'MARGIN_CREATED',
      details: {
        marginType: margin.marginType,
        marginPercentage: margin.marginPercentage?.toString() || '0',
        marginAmount: margin.marginAmount?.toString() || '0',
        calculatedMargin: margin.calculatedMargin?.toString() || '0',
      },
    })

    // Override event
    if (margin.isOverridden && margin.overriddenAt && margin.overriddenByUser) {
      history.push({
        timestamp: margin.overriddenAt,
        action: 'MARGIN_OVERRIDDEN',
        actor: margin.overriddenByUser,
        details: {
          marginType: margin.marginType,
          marginPercentage: margin.marginPercentage?.toString() || '0',
          marginAmount: margin.marginAmount?.toString() || '0',
          notes: margin.notes || '',
          originalCalculated: margin.calculatedMargin?.toString() || '0',
        },
      })
    }

    return {
      margin,
      history: history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }
  }

  /**
   * Get all margins for a contract
   * Useful for reporting and analytics
   */
  static async getMarginsByContract(contractId: string) {
    return prisma.margin.findMany({
      where: { contractId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            totalAmount: true,
            status: true,
            issueDate: true,
          },
        },
        overriddenByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Validate margin configuration
   */
  static validateMarginData(data: {
    marginType: MarginType
    marginPercentage?: Decimal | number
    marginAmount?: Decimal | number
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.marginType === MarginType.VARIABLE) {
      if (!data.marginPercentage) {
        errors.push('Margin percentage is required for VARIABLE margin type')
      } else {
        const percentage = Number(data.marginPercentage)
        if (percentage < 0 || percentage > 100) {
          errors.push('Margin percentage must be between 0 and 100')
        }
      }
    }

    if (data.marginType === MarginType.FIXED) {
      if (!data.marginAmount) {
        errors.push('Margin amount is required for FIXED margin type')
      } else {
        const amount = Number(data.marginAmount)
        if (amount < 0) {
          errors.push('Margin amount must be non-negative')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calculate margin summary for reporting
   */
  static getMarginSummary(margin: {
    marginType: MarginType
    marginPercentage: Decimal | null
    marginAmount: Decimal | null
    calculatedMargin: Decimal | null
    isOverridden: boolean
  }): string {
    const lines = [
      `Margin Type: ${margin.marginType}`,
      `Margin Percentage: ${margin.marginPercentage?.toFixed(2) || '0'}%`,
      `Margin Amount: $${margin.marginAmount?.toFixed(2) || '0'}`,
      `Calculated Margin: $${margin.calculatedMargin?.toFixed(2) || '0'}`,
      margin.isOverridden ? '⚠️  Margin has been overridden by admin' : '',
    ].filter(Boolean)

    return lines.join('\n')
  }
}
