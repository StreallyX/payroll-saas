/**
 * Helper for validating that a parent contract is a valid MSA
 * 
 * Used during SOW creation to ensure the parent
 * exists, is an MSA, and is in a valid state.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Validates that a parent contract is an active MSA of the same tenant
 * 
 * Validation rules:
 * - Parent contract must exist
 * - Parent contract must be of type "msa"
 * - Parent contract must belong to the same tenant
 * - Parent contract must be in a valid status (not cancelled)
 * 
 * @param prisma - Instance Prisma Client
 * @param parentId - Parent contract ID
 * @param tenantId - Tenant ID (for security verification)
 * @returns Parent MSA contract with its participants
 * @throws TRPCError if validation fails
 * 
 * @example
 * const parentMSA = await validateParentMSA(prisma, "clxxx123", "tenant_abc");
 * // Utiliser parentMSA.currencyId, parentMSA.contractCountryId, etc.
 */
export async function validateParentMSA(
  prisma: PrismaClient,
  parentId: string,
  tenantId: string
) {
  // 1. Retrieve parent contract
  const parent = await prisma.contract.findFirst({
    where: {
      id: parentId,
      tenantId,
    },
    include: {
      participants: {
        where: { isActive: true },
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
      },
    },
  });

  // 2. Verify parent exists
  if (!parent) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Parent MSA not found. Verify the ID is correct and you have access to this contract.",
    });
  }

  // 3. Verify parent is an MSA
  if (parent.type !== "msa") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Parent contract must be an MSA. Current type: ${parent.type}. ` +
               "A SOW can only be linked to an MSA, not to another SOW.",
    });
  }

  // 4. Verify MSA is in a valid status
  const validStatuses = [
    "draft",
    "pending_admin_review",
    "completed",
    "active",
  ];

  if (!validStatuses.includes(parent.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Parent MSA is in status "${parent.status}" and cannot be used. ` +
               `Statuts valides: ${validStatuses.join(", ")}.`,
    });
  }

  // 5. Optional: Warn if parent MSA is still in draft
  if (parent.status === "draft") {
    console.warn(
      `[validateParentMSA] Warning: Creating SOW with parent MSA ${parentId} ` +
      `which is still in draft status. This may require review.`
    );
  }

  return parent;
}

/**
 * Retrieves all MSAs available for creating a SOW
 * 
 * Useful for displaying a list of MSAs in a UI selector.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - Tenant ID
 * @param activeOnly - Only return active MSAs (default: false)
 * @returns List of available MSAs
 * 
 * @example
 * const availableMSAs = await getAvailableMSAsList(prisma, "tenant_abc", true);
 */
export async function getAvailableMSAsList(
  prisma: PrismaClient,
  tenantId: string,
  activeOnly: boolean = false
) {
  const where: any = {
    tenantId,
    type: "msa",
  };

  if (activeOnly) {
    where.status = { in: ["active", "completed"] };
  } else {
    // Exclude only cancelled and terminated
    where.status = { notIn: ["cancelled", "terminated"] };
  }

  return await prisma.contract.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      workflowStatus: true,
      createdAt: true,
      participants: {
        where: {
          role: "client",
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
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
