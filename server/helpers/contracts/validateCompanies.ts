/**
 * Helper for validating that companies exist and are active
 * 
 * Used during NORM contract creation to ensure that
 * companies (tenant and agency) exist and are in a valid state.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Validates that a company exists and is active in the tenant
 * 
 * Validation rules:
 * - Company must exist
 * - Company must belong to the same tenant
 * - Company must be active (status="active")
 * 
 * @param prisma - Instance Prisma Client
 * @param companyId - Company ID to validate
 * @param tenantId - Tenant ID (for security verification)
 * @param companyType - Company type ("tenant" or "agency") for error messages
 * @returns Validated company
 * @throws TRPCError if validation fails
 * 
 * @example
 * const companyTenant = await validateCompany(prisma, "clxxx123", "tenant_abc", "tenant");
 */
export async function validateCompany(
  prisma: PrismaClient,
  companyId: string,
  tenantId: string,
  companyType: "tenant" | "agency" = "tenant"
) {
  // 1. Retrieve company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      tenantId,
    },
    include: {
      bank: {
        select: {
          id: true,
          name: true,
          accountNumber: true,
        },
      },
      country: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  // 2. Verify company exists
  if (!company) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Company ${companyType} not found. Verify the ID is correct and you have access to this company.`,
    });
  }

  // 3. Verify company is active
  if (company.status !== "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `The company ${companyType} "${company.name}" is inactive (status: ${company.status}) and cannot be used in a contract.`,
    });
  }

  return company;
}

/**
 * Validates multiple companies in a single operation
 * 
 * Useful for validating both tenant company and agency.
 * 
 * @param prisma - Instance Prisma Client
 * @param companyTenantId - Tenant company ID
 * @param agencyId - ID de l'agency
 * @param tenantId - ID du tenant
 * @returns Object containing both validated companies
 * @throws TRPCError if validation fails
 * 
 * @example
 * const { companyTenant, agency } = await validateCompanies(
 *   prisma,
 *   "clxxx123",
 *   "clyyy456",
 *   "tenant_abc"
 * );
 */
export async function validateCompanies(
  prisma: PrismaClient,
  companyTenantId: string,
  agencyId: string,
  tenantId: string
) {
  // Validate both companies in parallel
  const [companyTenant, agency] = await Promise.all([
    validateCompany(prisma, companyTenantId, tenantId, "tenant"),
    validateCompany(prisma, agencyId, tenantId, "agency"),
  ]);

  // Verify they are not the same company
  if (companyTenant.id === agency.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tenant company and agency cannot be the same company.",
    });
  }

  return {
    companyTenant,
    agency,
  };
}

/**
 * Retrieves all companies available for creating a NORM contract
 * 
 * Useful for displaying a list of companies in a UI selector.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - ID du tenant
 * @param activeOnly - Only return active companies (default: true)
 * @returns List of available companies
 * 
 * @example
 * const companies = await getAvailableCompaniesList(prisma, "tenant_abc");
 */
export async function getAvailableCompaniesList(
  prisma: PrismaClient,
  tenantId: string,
  activeOnly: boolean = true
) {
  const where: any = {
    tenantId,
  };

  if (activeOnly) {
    where.status = "active";
  }

  return await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      contactEmail: true,
      contactPhone: true,
      status: true,
      country: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
