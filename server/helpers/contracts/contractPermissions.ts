/**
 * Helpers pour vérifier les permissions et l'accès aux contrats
 * 
 * Ces helpers vérifient si un utilisateur a les droits nécessaires pour
 * effectuer des actions sur un contrat (lecture, modification, upload de documents).
 */

import { PrismaClient } from "@prisma/client";

/**
 * Vérifie si un utilisateur est participant d'un contrat
 * 
 * Un utilisateur est considéré comme participant si :
 * - Il apparaît directement dans ContractParticipant (via userId)
 * - Il est membre d'une company qui est participante (via companyId)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur est participant, false sinon
 * 
 * @example
 * const canAccess = await isContractParticipant(prisma, "clxxx123", "clusr456");
 */
export async function isContractParticipant(
  prisma: PrismaClient,
  contractId: string,
  userId: string
): Promise<boolean> {
  try {
    // Vérifier si l'utilisateur est directement participant
    const directParticipant = await prisma.contractParticipant.findFirst({
      where: {
        contractId,
        userId,
        isActive: true,
      },
    });

    if (directParticipant) {
      return true;
    }

    // Vérifier si l'utilisateur est membre d'une company participante
    const companyParticipant = await prisma.contractParticipant.findFirst({
      where: {
        contractId,
        isActive: true,
        companyId: {
          not: null,
        },
        company: {
          companyUsers: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      },
    });

    return !!companyParticipant;
  } catch (error) {
    console.error("[isContractParticipant] Error:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut modifier un contrat
 * 
 * Un utilisateur peut modifier un contrat si :
 * - Il a la permission contract.update.global OU
 * - Il a la permission contract.update.own ET est participant du contrat OU
 * - Il est le créateur du contrat (createdBy) ET a contract.update.own
 * 
 * De plus, certains statuts de contrat empêchent toute modification :
 * - Les contrats "active" et "completed" ne peuvent plus être modifiés
 *   (sauf pour certaines actions spécifiques)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur
 * @param userPermissions - Permissions de l'utilisateur (clés des permissions)
 * @returns true si l'utilisateur peut modifier, false sinon
 * 
 * @example
 * const canModify = await canModifyContract(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.update.own", "contract.read.global"]
 * );
 */
export async function canModifyContract(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Récupérer le contrat pour vérifier le statut et le créateur
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        workflowStatus: true,
        createdBy: true,
      },
    });

    if (!contract) {
      return false;
    }

    // Les contrats "completed" et "active" ne peuvent plus être modifiés
    // (sauf pour uploader des documents signés, mais c'est géré ailleurs)
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      // Seul contract.update.global peut modifier ces contrats
      return userPermissions.includes("contract.update.global");
    }

    // Permission "own" nécessite d'être participant ou créateur
    if (userPermissions.includes("contract.update.own")) {
      // Vérifier si l'utilisateur est le créateur
      if (contract.createdBy === userId) {
        return true;
      }

      // Vérifier si l'utilisateur est participant
      const isParticipant = await isContractParticipant(prisma, contractId, userId);
      return isParticipant;
    }

    return false;
  } catch (error) {
    console.error("[canModifyContract] Error:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut uploader des documents pour un contrat
 * 
 * Un utilisateur peut uploader des documents si :
 * - Il est participant du contrat (directement ou via company) ET
 * - Le contrat n'est pas en statut "completed" ou "active"
 * 
 * Exception: Les utilisateurs avec contract.update.global peuvent toujours uploader
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur
 * @param userPermissions - Permissions de l'utilisateur (clés des permissions)
 * @returns true si l'utilisateur peut uploader, false sinon
 * 
 * @example
 * const canUpload = await canUploadDocument(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canUploadDocument(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Récupérer le contrat pour vérifier le statut
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        workflowStatus: true,
      },
    });

    if (!contract) {
      return false;
    }

    // Les contrats "completed" et "active" ne permettent plus l'upload
    // (sauf pour contract.update.global, déjà vérifié plus haut)
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      return false;
    }

    // Vérifier si l'utilisateur est participant
    const isParticipant = await isContractParticipant(prisma, contractId, userId);
    return isParticipant;
  } catch (error) {
    console.error("[canUploadDocument] Error:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut supprimer un document
 * 
 * Un utilisateur peut supprimer un document si :
 * - Il est l'uploader du document OU
 * - Il a la permission contract.update.global
 * 
 * De plus, le contrat ne doit pas être "completed" ou "active"
 * (sauf pour contract.update.global)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractDocumentId - ID du ContractDocument
 * @param userId - ID de l'utilisateur
 * @param userPermissions - Permissions de l'utilisateur (clés des permissions)
 * @returns true si l'utilisateur peut supprimer, false sinon
 * 
 * @example
 * const canDelete = await canDeleteDocument(
 *   prisma,
 *   "cldoc123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canDeleteDocument(
  prisma: PrismaClient,
  contractDocumentId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Récupérer le document avec le contrat associé
    const contractDocument = await prisma.contractDocument.findUnique({
      where: { id: contractDocumentId },
      include: {
        contract: {
          select: {
            workflowStatus: true,
          },
        },
      },
    });

    if (!contractDocument) {
      return false;
    }

    // Les contrats "completed" et "active" ne permettent plus la suppression
    const contract = contractDocument.contract;
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      return false;
    }

    // Vérifier si l'utilisateur est l'uploader
    if (contractDocument.uploadedByUserId === userId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[canDeleteDocument] Error:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut voir un contrat
 * 
 * Un utilisateur peut voir un contrat si :
 * - Il a la permission contract.read.global OU
 * - Il a la permission contract.read.own ET est participant du contrat OU
 * - Il est le créateur du contrat (createdBy)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur
 * @param userPermissions - Permissions de l'utilisateur (clés des permissions)
 * @returns true si l'utilisateur peut voir, false sinon
 * 
 * @example
 * const canView = await canViewContract(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canViewContract(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.read.global")) {
      return true;
    }

    // Récupérer le contrat pour vérifier le créateur
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        createdBy: true,
      },
    });

    if (!contract) {
      return false;
    }

    // Permission "own" nécessite d'être participant ou créateur
    if (userPermissions.includes("contract.read.own")) {
      // Vérifier si l'utilisateur est le créateur
      if (contract.createdBy === userId) {
        return true;
      }

      // Vérifier si l'utilisateur est participant
      const isParticipant = await isContractParticipant(prisma, contractId, userId);
      return isParticipant;
    }

    return false;
  } catch (error) {
    console.error("[canViewContract] Error:", error);
    return false;
  }
}
