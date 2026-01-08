/**
 * Helpers for managing additional participants
 * 
 * These helpers facilitate creation and validation of participants
 * during contract creation or manual participant addition.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AdditionalParticipantInput } from "@/server/validators/simpleContract";

/**
 * Creates multiple additional participants for a contract
 * 
 * This function is used during contract creation to add
 * all additional participants in a single transaction.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param participants - Array of participants to create
 * @returns Array of created participants
 * @throws TRPCError if validation fails
 * 
 * @example
 * await createAdditionalParticipants(prisma, "clxxx123", [
 *   { userId: "clusr1", role: "additional" },
 *   { companyId: "clcmp1", role: "additional" },
 *   { userId: "clusr2", companyId: "clcmp2", role: "additional" },
 * ]);
 */
export async function createAdditionalParticipants(
  prisma: PrismaClient,
  contractId: string,
  participants: AdditionalParticipantInput[]
) {
  if (!participants || participants.length === 0) {
    return [];
  }

  const createdParticipants = [];

  for (const participant of participants) {
    const { userId, companyId, role } = participant;

    // Validation: at least userId or companyId must be provided
    if (!userId && !companyId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least userId or companyId must be provided for each participant",
      });
    }

    // Check if participant doesn't already exist
    const existingParticipant = await prisma.contractParticipant.findFirst({
      where: {
        contractId,
        ...(userId && { userId }),
        ...(companyId && { companyId }),
        role,
      },
    });

    if (existingParticipant) {
      console.warn(
        `[createAdditionalParticipants] Participant already exists: userId=${userId}, companyId=${companyId}, role=${role}`
      );
      continue;
    }

    // Create participant
    try {
      const created = await prisma.contractParticipant.create({
        data: {
          contractId,
          userId: userId || null,
          companyId: companyId || null,
          role,
          isPrimary: false,
          requiresSignature: false,
          approved: false,
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

      createdParticipants.push(created);
    } catch (error) {
      console.error("[createAdditionalParticipants] Error creating participant:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create additional participant",
        cause: error,
      });
    }
  }

  return createdParticipants;
}

/**
 * Checks if a participant can be deleted
 * 
 * Main participants (company_tenant, agency, contractor) cannot
 * be deleted as they are essential to the contract.
 * 
 * @param role - Participant role
 * @returns true if participant can be deleted, false otherwise
 * 
 * @example
 * const canRemove = canRemoveParticipant("additional"); // true
 * const canRemove = canRemoveParticipant("company_tenant"); // false
 */
export function canRemoveParticipant(role: string): boolean {
  const protectedRoles = ["company_tenant", "agency", "contractor"];
  return !protectedRoles.includes(role);
}

/**
 * Validates that a participant can be added to a contract
 * 
 * Verifies that:
 * - Contract exists and is in a modifiable status (draft or pending)
 * - Au moins userId ou companyId est fourni
 * - User or company exist if provided
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - User ID (optional)
 * @param companyId - Company ID (optional)
 * @throws TRPCError if validation fails
 * 
 * @example
 * await validateParticipantAddition(prisma, "clxxx123", "clusr456", null);
 */
export async function validateParticipantAddition(
  prisma: PrismaClient,
  contractId: string,
  userId?: string,
  companyId?: string
) {
  // Validation 1: At least userId or companyId must be provided
  if (!userId && !companyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "At least userId or companyId must be provided",
    });
  }

  // Validation 2: Contract exists and is modifiable
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      workflowStatus: true,
    },
  });

  if (!contract) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Contrat introuvable",
    });
  }

  // "completed" and "active" contracts can no longer be modified
  if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot add participants to a completed or active contract",
    });
  }

  // Validation 3: Verify user exists (if provided)
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }
  }

  // Validation 4: Verify company exists (if provided)
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Company introuvable",
      });
    }
  }
}

/**
 * Retrieves the company associated with a user (if it exists)
 * 
 * Useful for implementing "link user's company" feature
 * when selecting a participant.
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - User ID
 * @returns Associated company or null
 * 
 * @example
 * const userCompany = await getUserCompany(prisma, "clusr456");
 * if (userCompany) {
 *   // Offer to also link the company
 * }
 */
export async function getUserCompany(
  prisma: PrismaClient,
  userId: string
) {
  try {
    // Find an active CompanyUser for this user
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Take the most recent if multiple
      },
    });

    return companyUser?.company || null;
  } catch (error) {
    console.error("[getUserCompany] Error:", error);
    return null;
  }
}
