/**
 * Helper for validating that a user is a contractor
 * 
 * Used during NORM contract creation to ensure that
 * the user selected as contractor has the appropriate role.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Validates that a user is an active contractor of the tenant
 * 
 * Validation rules:
 * - User must exist
 * - User must belong to the same tenant
 * - User must have a role named "CONTRACTOR" (or similar)
 * - User must be active (isActive=true)
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - User ID to validate
 * @param tenantId - Tenant ID (for security verification)
 * @returns Validated contractor user with their role
 * @throws TRPCError if validation fails
 * 
 * @example
 * const contractor = await validateContractor(prisma, "clxxx123", "tenant_abc");
 * // contractor.role.name === "CONTRACTOR"
 */
export async function validateContractor(
  prisma: PrismaClient,
  userId: string,
  tenantId: string
) {
  // 1. Retrieve user with their role
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  });

  // 2. Verify user exists
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found. Verify the ID is correct and you have access to this user.",
    });
  }

  // 3. Verify user is active
  if (!user.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `The user "${user.name || user.email}" is inactive and cannot be assigned as contractor.`,
    });
  }

  // 4. Verify user has CONTRACTOR role
  const contractorRoleNames = [
    "CONTRACTOR",
    "contractor",
    "Contractor",
  ];

  if (!contractorRoleNames.includes(user.role.name)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `The user "${user.name || user.email}" does not have CONTRACTOR role. ` +
               `Current role: ${user.role.displayName || user.role.name}. ` +
               "Only users with CONTRACTOR role can be assigned to a NORM contract.",
    });
  }

  return user;
}

/**
 * Retrieves all contractors available for creating a NORM contract
 * 
 * Useful for displaying a list of contractors in a UI selector.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - Tenant ID
 * @param activeOnly - Only return active contractors (default: true)
 * @returns List of available contractors
 * 
 * @example
 * const contractors = await getAvailableContractorsList(prisma, "tenant_abc");
 */
export async function getAvailableContractorsList(
  prisma: PrismaClient,
  tenantId: string,
  activeOnly: boolean = true
) {
  const where: any = {
    tenantId,
    role: {
      name: { in: ["CONTRACTOR", "contractor", "Contractor"] },
    },
  };

  if (activeOnly) {
    where.isActive = true;
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePictureUrl: true,
      isActive: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
