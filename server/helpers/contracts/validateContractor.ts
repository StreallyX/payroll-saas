/**
 * Helper pour valider qu'un utilisateur est bien un contractor
 * 
 * Utilisé lors de la création d'un contrat NORM pour s'assurer que
 * l'utilisateur sélectionné comme contractor a bien le rôle approprié.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valide qu'un utilisateur est bien un contractor actif du tenant
 * 
 * Règles de validation :
 * - L'utilisateur doit exister
 * - L'utilisateur doit appartenir au même tenant
 * - L'utilisateur doit avoir un rôle nommé "CONTRACTOR" (ou similaire)
 * - L'utilisateur doit être actif (isActive=true)
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - ID de l'utilisateur à valider
 * @param tenantId - ID du tenant (pour vérification de sécurité)
 * @returns Utilisateur contractor validé avec son rôle
 * @throws TRPCError si validation échoue
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
  // 1. Récupérer l'utilisateur avec son rôle
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

  // 2. Vérifier que l'utilisateur existe
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable. Vérifiez que l'ID est correct et que vous avez accès à cet utilisateur.",
    });
  }

  // 3. Vérifier que l'utilisateur est actif
  if (!user.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `L'utilisateur "${user.name || user.email}" est inactif et ne peut pas être assigné comme contractor.`,
    });
  }

  // 4. Vérifier que l'utilisateur a le rôle CONTRACTOR
  const contractorRoleNames = [
    "CONTRACTOR",
    "contractor",
    "Contractor",
  ];

  if (!contractorRoleNames.includes(user.role.name)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `L'utilisateur "${user.name || user.email}" n'a pas le rôle CONTRACTOR. ` +
               `Rôle actuel: ${user.role.displayName || user.role.name}. ` +
               "Seuls les utilisateurs avec le rôle CONTRACTOR peuvent être assignés à un contrat NORM.",
    });
  }

  return user;
}

/**
 * Récupère tous les contractors disponibles pour créer un contrat NORM
 * 
 * Utile pour afficher une liste de contractors dans un sélecteur UI.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - ID du tenant
 * @param activeOnly - Ne retourner que les contractors actifs (par défaut: true)
 * @returns Liste des contractors disponibles
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
