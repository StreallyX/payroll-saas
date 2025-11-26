/**
 * User Helper Functions
 * 
 * Helpers pour la gestion des users avec visibilité basée sur RBAC
 * et hiérarchie parent-enfant
 */

import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export type UserWithCompany = User & {
  company?: {
    id: string;
    name: string;
    type: string;
  } | null;
};

/**
 * Récupère les users visibles pour un user donné selon les règles RBAC
 * 
 * Logique:
 * - Scope global (Platform Admin) → tous les users du tenant
 * - Scope ownCompany (Agency Admin) → tous les users de la même company
 * - Scope parent → seulement les users enfants (createdBy = currentUser.id)
 * 
 * @param currentUser - User actuel
 * @param scope - Scope RBAC ("global" | "ownCompany" | "parent")
 * @param filters - Filtres optionnels (roleId, status, etc.)
 * @returns Liste des users visibles
 */
export async function getUsersVisibleFor(
  currentUser: User,
  scope: "global" | "ownCompany" | "parent",
  filters?: {
    roleId?: string;
    status?: string;
    isActive?: boolean;
  }
): Promise<UserWithCompany[]> {
  const where: any = {
    tenantId: currentUser.tenantId,
  };

  // Appliquer les filtres
  if (filters?.roleId) {
    where.roleId = filters.roleId;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // Appliquer le scope
  switch (scope) {
    case "global":
      // Platform Admin: tous les users du tenant
      // Pas de filtre supplémentaire
      break;

    case "ownCompany":
      // Agency Admin: tous les users de la même company
      if (currentUser.companyId) {
        where.companyId = currentUser.companyId;
      } else {
        // Si pas de company, retourner seulement les users créés par lui
        where.createdBy = currentUser.id;
      }
      break;

    case "parent":
      // User normal: seulement les users enfants
      where.createdBy = currentUser.id;
      break;

    default:
      // Par défaut, seulement l'utilisateur lui-même
      where.id = currentUser.id;
  }

  return prisma.user.findMany({
    where,
    orderBy: [{ name: "asc" }, { email: "asc" }],
    include: {
      company: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  });
}

/**
 * Récupère les users créés par un user (enfants directs)
 * 
 * @param parentUserId - ID du user parent
 * @param includeInactive - Inclure les users inactifs
 * @returns Liste des users enfants
 */
export async function getChildUsers(
  parentUserId: string,
  includeInactive: boolean = false
): Promise<User[]> {
  const where: any = {
    createdBy: parentUserId,
  };

  if (!includeInactive) {
    where.isActive = true;
  }

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
}

/**
 * Récupère tous les users d'une company (via companyId ou CompanyUser)
 * 
 * @param companyId - ID de la company
 * @param includeInactive - Inclure les users inactifs
 * @returns Liste des users de la company
 */
export async function getCompanyUsers(
  companyId: string,
  includeInactive: boolean = false
): Promise<User[]> {
  // Users avec companyId direct
  const directUsers = await prisma.user.findMany({
    where: {
      companyId,
      isActive: includeInactive ? undefined : true,
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

  // Users via CompanyUser (table de jonction)
  const companyUserRelations = await prisma.companyUser.findMany({
    where: {
      companyId,
      isActive: includeInactive ? undefined : true,
    },
    include: {
      user: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  const junctionUsers = companyUserRelations.map((rel) => rel.user);

  // Combiner et dédupliquer
  const allUsers = [...directUsers, ...junctionUsers];
  const uniqueUsers = Array.from(
    new Map(allUsers.map((user) => [user.id, user])).values()
  );

  return uniqueUsers;
}

/**
 * Vérifie si un user appartient à une company
 * 
 * @param userId - ID du user
 * @param companyId - ID de la company
 * @returns true si le user appartient à la company
 */
export async function isUserInCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  // Vérifier companyId direct
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (user?.companyId === companyId) {
    return true;
  }

  // Vérifier CompanyUser
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
