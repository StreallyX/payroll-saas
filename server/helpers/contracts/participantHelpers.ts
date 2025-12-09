/**
 * Helpers pour la gestion des participants supplémentaires
 * 
 * Ces helpers facilitent la création et la validation des participants
 * lors de la création de contrats ou l'ajout manuel de participants.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AdditionalParticipantInput } from "@/server/validators/simpleContract";

/**
 * Crée plusieurs participants supplémentaires pour un contrat
 * 
 * Cette fonction est utilisée lors de la création de contrats pour ajouter
 * tous les participants supplémentaires en une seule transaction.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param participants - Tableau de participants à créer
 * @returns Tableau des participants créés
 * @throws TRPCError si validation échoue
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

    // Validation: au moins userId ou companyId doit être fourni
    if (!userId && !companyId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Au moins userId ou companyId doit être fourni pour chaque participant",
      });
    }

    // Vérifier si le participant n'existe pas déjà
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

    // Créer le participant
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
        message: "Échec de la création d'un participant supplémentaire",
        cause: error,
      });
    }
  }

  return createdParticipants;
}

/**
 * Vérifie si un participant peut être supprimé
 * 
 * Les participants principaux (company_tenant, agency, contractor) ne peuvent
 * pas être supprimés car ils sont essentiels au contrat.
 * 
 * @param role - Rôle du participant
 * @returns true si le participant peut être supprimé, false sinon
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
 * Valide qu'un participant peut être ajouté à un contrat
 * 
 * Vérifie que :
 * - Le contrat existe et est dans un statut modifiable (draft ou pending)
 * - Au moins userId ou companyId est fourni
 * - L'utilisateur ou la company existent s'ils sont fournis
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur (optionnel)
 * @param companyId - ID de la company (optionnel)
 * @throws TRPCError si validation échoue
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
  // Validation 1: Au moins userId ou companyId doit être fourni
  if (!userId && !companyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Au moins userId ou companyId doit être fourni",
    });
  }

  // Validation 2: Le contrat existe et est modifiable
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

  // Les contrats "completed" et "active" ne peuvent plus être modifiés
  if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Impossible d'ajouter des participants à un contrat complété ou actif",
    });
  }

  // Validation 3: Vérifier que l'utilisateur existe (si fourni)
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

  // Validation 4: Vérifier que la company existe (si fournie)
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
 * Récupère la company associée à un utilisateur (si elle existe)
 * 
 * Utile pour implémenter la fonctionnalité "lier la company du user"
 * lors de la sélection d'un participant.
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - ID de l'utilisateur
 * @returns Company associée ou null
 * 
 * @example
 * const userCompany = await getUserCompany(prisma, "clusr456");
 * if (userCompany) {
 *   // Proposer de lier aussi la company
 * }
 */
export async function getUserCompany(
  prisma: PrismaClient,
  userId: string
) {
  try {
    // Chercher une CompanyUser active pour cet utilisateur
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
        createdAt: "desc", // Prendre la plus récente si plusieurs
      },
    });

    return companyUser?.company || null;
  } catch (error) {
    console.error("[getUserCompany] Error:", error);
    return null;
  }
}
