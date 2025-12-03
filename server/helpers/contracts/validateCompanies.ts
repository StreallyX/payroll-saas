/**
 * Helper pour valider que les companies existent et sont actives
 * 
 * Utilisé lors de la création d'un contrat NORM pour s'assurer que
 * les companies (tenant et agency) existent et sont dans un état valide.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valide qu'une company existe et est active dans le tenant
 * 
 * Règles de validation :
 * - La company doit exister
 * - La company doit appartenir au même tenant
 * - La company doit être active (status="active")
 * 
 * @param prisma - Instance Prisma Client
 * @param companyId - ID de la company à valider
 * @param tenantId - ID du tenant (pour vérification de sécurité)
 * @param companyType - Type de company ("tenant" ou "agency") pour messages d'erreur
 * @returns Company validée
 * @throws TRPCError si validation échoue
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
  // 1. Récupérer la company
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

  // 2. Vérifier que la company existe
  if (!company) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Company ${companyType} introuvable. Vérifiez que l'ID est correct et que vous avez accès à cette company.`,
    });
  }

  // 3. Vérifier que la company est active
  if (company.status !== "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `La company ${companyType} "${company.name}" est inactive (statut: ${company.status}) et ne peut pas être utilisée dans un contrat.`,
    });
  }

  return company;
}

/**
 * Valide plusieurs companies en une seule opération
 * 
 * Utile pour valider à la fois la company tenant et l'agency.
 * 
 * @param prisma - Instance Prisma Client
 * @param companyTenantId - ID de la company tenant
 * @param agencyId - ID de l'agency
 * @param tenantId - ID du tenant
 * @returns Object contenant les deux companies validées
 * @throws TRPCError si une validation échoue
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
  // Valider les deux companies en parallèle
  const [companyTenant, agency] = await Promise.all([
    validateCompany(prisma, companyTenantId, tenantId, "tenant"),
    validateCompany(prisma, agencyId, tenantId, "agency"),
  ]);

  // Vérifier que ce ne sont pas la même company
  if (companyTenant.id === agency.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "La company tenant et l'agency ne peuvent pas être la même company.",
    });
  }

  return {
    companyTenant,
    agency,
  };
}

/**
 * Récupère toutes les companies disponibles pour créer un contrat NORM
 * 
 * Utile pour afficher une liste de companies dans un sélecteur UI.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - ID du tenant
 * @param activeOnly - Ne retourner que les companies actives (par défaut: true)
 * @returns Liste des companies disponibles
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
