/**
 * Helper for creating minimal participants for simplified contracts
 * 
 * This helper ensures participants are created correctly with
 * appropriate validation rules (e.g., approvers cannot sign).
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface CreateMinimalParticipantInput {
  contractId: string;
  userId?: string;
  companyId?: string;
  role: string;
  isPrimary?: boolean;
  requiresSignature?: boolean;
  approved?: boolean;
}

/**
 * Creates a minimal participant for a simplified contract
 * 
 * Validation rules:
 * - Either userId or companyId must be provided (at least one)
 * - Default: isActive=true, approved=false, requiresSignature=false
 * - Approvers can NEVER have requiresSignature=true
 * 
 * @param prisma - Instance Prisma Client
 * @param input - Participant data
 * @returns Participant created
 * @throws TRPCError if validation fails
 * 
 * @example
 * await createMinimalParticipant(prisma, {
 *   contractId: "clxxx123",
 *   companyId: "clyyy456",
 *   role: "client",
 *   isPrimary: true,
 * });
 */
export async function createMinimalParticipant(
  prisma: PrismaClient,
  input: CreateMinimalParticipantInput
) {
  const {
    contractId,
    userId,
    companyId,
    role,
    isPrimary = false,
    requiresSignature = false,
    approved = false,
  } = input;

  // Validation 1: At least userId or companyId must be provided
  if (!userId && !companyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "At least userId or companyId must be provided to create a participant",
    });
  }

  // Validation 2: Approvers can NEVER have requiresSignature=true
  if (role === "approver" && requiresSignature) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Approvers cannot have requiresSignature=true. " +
               "Approvers approve, they don't sign.",
    });
  }

  // Create participant
  try {
    return await prisma.contractParticipant.create({
      data: {
        contractId,
        userId: userId || null,
        companyId: companyId || null,
        role,
        isPrimary,
        requiresSignature,
        approved,
        isActive: true,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[createMinimalParticipant] Error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create participant",
      cause: error,
    });
  }
}

/**
 * Automatically creates a "client" participant based on a company
 * 
 * Shortcut for creating a primary client without required signature.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param companyId - Company ID
 * @returns Client participant created
 * 
 * @example
 * await createClientParticipant(prisma, "clxxx123", "clyyy456");
 */
export async function createClientParticipant(
  prisma: PrismaClient,
  contractId: string,
  companyId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    companyId,
    role: "client",
    isPrimary: true,
    requiresSignature: false,
    approved: false,
  });
}

/**
 * Automatically creates a "contractor" participant based on a user
 * 
 * Shortcut for creating a primary contractor with required signature.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - Contractor user ID
 * @returns Contractor participant created
 * 
 * @example
 * await createContractorParticipant(prisma, "clxxx123", "clzzz789");
 */
export async function createContractorParticipant(
  prisma: PrismaClient,
  contractId: string,
  userId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    userId,
    role: "contractor",
    isPrimary: true,
    requiresSignature: true,
    approved: false,
  });
}

/**
 * Creates an "approver" participant (internal admin who approves the contract)
 * 
 * IMPORTANT: Approvers never have requiresSignature=true.
 * They approve via the "approved" field, they don't sign.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - Approver user ID
 * @returns Approver participant created
 * 
 * @example
 * await createApproverParticipant(prisma, "clxxx123", "cladmin123");
 */
export async function createApproverParticipant(
  prisma: PrismaClient,
  contractId: string,
  userId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    userId,
    role: "approver",
    isPrimary: false,
    requiresSignature: false, // ⚠️ CRITICAL: Always false for approvers
    approved: false,
  });
}
