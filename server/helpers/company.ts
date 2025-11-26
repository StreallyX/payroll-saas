/**
 * Company Helper Functions
 * 
 * Helpers pour la gestion des companies multi-tenant avec distinction
 * entre Tenant Companies (clients) et Agency Companies (prestataires)
 */

import { prisma } from "@/lib/db";
import type { User, Company } from "@prisma/client";

/**
 * Récupère les Tenant Companies (companies de type "tenant")
 * Ces companies représentent les clients de la plateforme
 * 
 * @param tenantId - ID du tenant
 * @param includeInactive - Inclure les companies inactives
 * @returns Liste des tenant companies
 */
export async function getTenantCompanies(
  tenantId: string,
  includeInactive: boolean = false
): Promise<Company[]> {
  const where: any = {
    tenantId,
    type: "tenant",
  };

  if (!includeInactive) {
    where.status = "active";
  }

  return prisma.company.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      bank: true,
      country: true,
    },
  });
}

/**
 * Récupère les Agency Companies (companies de type "agency")
 * Ces companies représentent les agences/prestataires
 * 
 * @param tenantId - ID du tenant
 * @param includeInactive - Inclure les companies inactives
 * @returns Liste des agency companies
 */
export async function getAgencyCompanies(
  tenantId: string,
  includeInactive: boolean = false
): Promise<Company[]> {
  const where: any = {
    tenantId,
    type: "agency",
  };

  if (!includeInactive) {
    where.status = "active";
  }

  return prisma.company.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      bank: true,
      country: true,
    },
  });
}

/**
 * Récupère la company d'un user (Agency Company)
 * Utilisé pour identifier la company de l'agency admin
 * 
 * @param userId - ID du user
 * @returns Company du user ou null
 */
export async function getUserCompany(userId: string): Promise<Company | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        include: {
          bank: true,
          country: true,
        },
      },
    },
  });

  return user?.company || null;
}

/**
 * Récupère les Tenant Companies visibles pour un user
 * - Platform Admin : toutes les tenant companies
 * - Agency Admin/User : version simplifiée (nom uniquement, pas de détails sensibles)
 * 
 * @param user - User actuel
 * @param hasGlobalScope - Si le user a un scope global (Platform Admin)
 * @returns Liste des tenant companies
 */
export async function getVisibleTenantCompanies(
  user: User,
  hasGlobalScope: boolean
): Promise<Company[]> {
  if (hasGlobalScope) {
    // Platform Admin: toutes les tenant companies avec tous les détails
    return getTenantCompanies(user.tenantId);
  } else {
    // Agency Admin/User: version simplifiée sans détails sensibles
    const companies = await getTenantCompanies(user.tenantId);
    
    // Retourne seulement les informations de base
    return companies.map((company) => ({
      ...company,
      vatNumber: null,
      invoicingContactEmail: null,
      invoicingContactPhone: null,
      alternateInvoicingEmail: null,
      bankId: null,
      bank: null,
    })) as Company[];

  }
}

/**
 * Vérifie si un user peut accéder à une company
 * 
 * @param userId - ID du user
 * @param companyId - ID de la company
 * @param hasGlobalScope - Si le user a un scope global
 * @returns true si le user peut accéder à la company
 */
export async function canAccessCompany(
  userId: string,
  companyId: string,
  hasGlobalScope: boolean
): Promise<boolean> {
  if (hasGlobalScope) {
    return true;
  }

  // Vérifier si c'est la company du user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (user?.companyId === companyId) {
    return true;
  }

  // Vérifier si le user est dans la table CompanyUser
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  return !!companyUser && companyUser.isActive;
}
