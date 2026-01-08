/**
 * Helper for validating that PaymentMethods (UserBanks) exist
 * 
 * Used during NORM contract creation to ensure that
 * selected payment methods exist and are active.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Validates that a payment method exists and is active
 * 
 * Validation rules:
 * - Payment method must exist
 * - It must belong to the same tenant
 * - It must be of type BANK_ACCOUNT
 * - It must be active (isActive=true)
 * - It must belong to the specified contractor
 * 
 * @param prisma - Instance Prisma Client
 * @param paymentMethodId - Payment method ID to validate
 * @param userId - Owner contractor ID
 * @param tenantId - Tenant ID (for security verification)
 * @returns Validated payment method
 * @throws TRPCError if validation fails
 * 
 * @example
 * const userBank = await validatePaymentMethod(prisma, "clxxx123", "cluser123", "tenant_abc");
 */
export async function validatePaymentMethod(
  prisma: PrismaClient,
  paymentMethodId: string,
  userId: string,
  tenantId: string
) {
  // 1. Retrieve payment method
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      tenantId,
      userId,
    },
  });

  // 2. Verify payment method exists
  if (!paymentMethod) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Payment method not found. Verify the ID is correct and it belongs to the contractor.",
    });
  }

  // 3. Verify payment method is active
  if (!paymentMethod.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selected payment method is inactive and cannot be used.",
    });
  }

  // 4. Verify it's a bank account
  if (paymentMethod.type !== "bank_account") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Only bank accounts can be used for NORM contracts. Current type: ${paymentMethod.type}.`,
    });
  }

  return paymentMethod;
}

/**
 * Validates multiple payment methods (for Split mode)
 * 
 * Useful for validating an array of PaymentMethods.
 * 
 * @param prisma - Instance Prisma Client
 * @param paymentMethodIds - Array of payment method IDs
 * @param userId - Owner contractor ID
 * @param tenantId - ID du tenant
 * @returns Array of validated payment methods
 * @throws TRPCError if validation fails
 * 
 * @example
 * const userBanks = await validateMultiplePaymentMethods(
 *   prisma,
 *   ["clxxx123", "clyyy456"],
 *   "cluser123",
 *   "tenant_abc"
 * );
 */
export async function validateMultiplePaymentMethods(
  prisma: PrismaClient,
  paymentMethodIds: string[],
  userId: string,
  tenantId: string
) {
  // Verify there is at least one payment method
  if (!paymentMethodIds || paymentMethodIds.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "At least one payment method must be provided for Split mode.",
    });
  }

  // Validate all payment methods in parallel
  const paymentMethods = await Promise.all(
    paymentMethodIds.map((id) =>
      validatePaymentMethod(prisma, id, userId, tenantId)
    )
  );

  // Verify there are no duplicates
  const uniqueIds = new Set(paymentMethodIds);
  if (uniqueIds.size !== paymentMethodIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Duplicate payment methods are not allowed.",
    });
  }

  return paymentMethods;
}

/**
 * Retrieves all payment methods available for a contractor
 * 
 * Useful for displaying a list of bank accounts in a UI selector.
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - ID du contractor
 * @param tenantId - ID du tenant
 * @param activeOnly - Only return active methods (default: true)
 * @returns List of available payment methods
 * 
 * @example
 * const userBanks = await getAvailablePaymentMethodsList(prisma, "cluser123", "tenant_abc");
 */
export async function getAvailablePaymentMethodsList(
  prisma: PrismaClient,
  userId: string,
  tenantId: string,
  activeOnly: boolean = true
) {
  const where: any = {
    tenantId,
    userId,
    type: "bank_account",
  };

  if (activeOnly) {
    where.isActive = true;
  }

  return await prisma.paymentMethod.findMany({
    where,
    select: {
      id: true,
      bankName: true,
      accountHolderName: true,
      accountNumber: true,
      iban: true,
      swiftCode: true,
      isDefault: true,
      isActive: true,
      isVerified: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
}
