/**
 * Helper pour valider qu'un contrat parent est bien un MSA valide
 * 
 * Utilisé lors de la création d'un SOW pour s'assurer que le parent
 * existe, est un MSA, et est dans un état valide.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valide qu'un contrat parent est bien un MSA actif du même tenant
 * 
 * Règles de validation :
 * - Le contrat parent doit exister
 * - Le contrat parent doit être du type "msa"
 * - Le contrat parent doit appartenir au même tenant
 * - Le contrat parent doit être dans un statut valide (pas cancelled)
 * 
 * @param prisma - Instance Prisma Client
 * @param parentId - ID du contrat parent
 * @param tenantId - ID du tenant (pour vérification de sécurité)
 * @returns Contrat MSA parent avec ses participants
 * @throws TRPCError si validation échoue
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
  // 1. Récupérer le contrat parent
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

  // 2. Vérifier que le parent existe
  if (!parent) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "MSA parent introuvable. Vérifiez que l'ID est correct et que vous avez accès à ce contrat.",
    });
  }

  // 3. Vérifier que le parent est bien un MSA
  if (parent.type !== "msa") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Le contrat parent doit être un MSA. Type actuel: ${parent.type}. ` +
               "Un SOW ne peut être lié qu'à un MSA, pas à un autre SOW.",
    });
  }

  // 4. Vérifier que le MSA est dans un statut valide
  const validStatuses = [
    "draft",
    "pending_admin_review",
    "completed",
    "active",
  ];

  if (!validStatuses.includes(parent.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Le MSA parent est en statut "${parent.status}" et ne peut pas être utilisé. ` +
               `Statuts valides: ${validStatuses.join(", ")}.`,
    });
  }

  // 5. Optionnel: Avertir si le MSA parent est encore en draft
  if (parent.status === "draft") {
    console.warn(
      `[validateParentMSA] Warning: Creating SOW with parent MSA ${parentId} ` +
      `which is still in draft status. This may require review.`
    );
  }

  return parent;
}

/**
 * Récupère tous les MSA disponibles pour créer un SOW
 * 
 * Utile pour afficher une liste de MSA dans un sélecteur UI.
 * 
 * @param prisma - Instance Prisma Client
 * @param tenantId - ID du tenant
 * @param activeOnly - Ne retourner que les MSA actifs (par défaut: false)
 * @returns Liste des MSA disponibles
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
    // Exclure seulement les cancelled et terminated
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
