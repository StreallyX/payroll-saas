/**
 * Contract Helper Functions
 * 
 * Helpers pour la gestion des contrats, participants, et workflows
 */

import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export interface ParticipantDisplay {
  type: "company" | "individual";
  name: string;
  representedBy?: string;
  userId: string;
  companyId?: string;
}

/**
 * Récupère l'affichage d'un participant pour un contrat
 * 
 * Logique:
 * - Si le user a une company → "Company Name (represented by User Name)"
 * - Sinon → "User Name (Individual Contractor)"
 * 
 * @param userId - ID du user participant
 * @returns Informations d'affichage du participant
 */
export async function getParticipantDisplayName(
  userId: string
): Promise<ParticipantDisplay | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  if (user.company) {
    // User a une company → afficher comme company
    return {
      type: "company",
      name: user.company.name,
      representedBy: user.name || user.email,
      userId: user.id,
      companyId: user.company.id,
    };
  } else {
    // User individuel → afficher comme individual
    return {
      type: "individual",
      name: user.name || user.email,
      userId: user.id,
    };
  }
}

/**
 * Formate l'affichage d'un participant pour l'UI
 * 
 * @param participant - Informations du participant
 * @returns Texte formaté pour l'affichage
 */
export function formatParticipantDisplay(
  participant: ParticipantDisplay
): string {
  if (participant.type === "company") {
    return `${participant.name} (represented by ${participant.representedBy})`;
  } else {
    return `${participant.name} (Individual Contractor)`;
  }
}

/**
 * Assigne automatiquement un Platform Admin comme approver pour un MSA
 * 
 * Logique:
 * 1. Cherche un user avec la permission "contract.approve.global"
 * 2. Sélectionne le plus ancien (first created) ou round-robin
 * 3. Crée automatiquement un ContractParticipant avec role="approver"
 * 
 * @param contractId - ID du contrat (MSA)
 * @param tenantId - ID du tenant
 * @returns ID du participant créé ou null si échec
 */
export async function assignPlatformApprover(
  contractId: string,
  tenantId: string
): Promise<string | null> {
  // 1. Trouver un Platform Admin avec la permission contract.approve.global
  const platformAdmins = await prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
      role: {
        rolePermissions: {
          some: {
            permission: {
              key: "contract.approve.global",
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" }, // Sélectionner le plus ancien
    take: 1,
  });

  if (platformAdmins.length === 0) {
    console.error(
      `[assignPlatformApprover] No Platform Admin found for tenant ${tenantId}`
    );
    return null;
  }

  const approver = platformAdmins[0];

  // 2. Vérifier si un approver n'est pas déjà assigné
  const existingApprover = await prisma.contractParticipant.findFirst({
    where: {
      contractId,
      role: "approver",
    },
  });

  if (existingApprover) {
    console.warn(
      `[assignPlatformApprover] Approver already assigned for contract ${contractId}`
    );
    return existingApprover.id;
  }

  // 3. Créer le ContractParticipant
  const participant = await prisma.contractParticipant.create({
    data: {
      contractId,
      userId: approver.id,
      role: "approver",
      approved: false,
      requiresSignature: false,
      isPrimary: false,
    },
  });

  console.log(
    `[assignPlatformApprover] Assigned approver ${approver.email} to contract ${contractId}`
  );

  return participant.id;
}

/**
 * Récupère tous les participants d'un contrat avec leurs informations d'affichage
 * 
 * @param contractId - ID du contrat
 * @returns Liste des participants avec leurs informations d'affichage
 */
export async function getContractParticipantsWithDisplay(
  contractId: string
): Promise<
  Array<{
    id: string;
    role: string;
    approved: boolean;
    requiresSignature: boolean;
    signedAt: Date | null;
    display: ParticipantDisplay;
  }>
> {
  const participants = await prisma.contractParticipant.findMany({
    where: {
      contractId,
      isActive: true,
    },
    orderBy: [{ isPrimary: "desc" }, { joinedAt: "asc" }],
  });

  const result = [];
  for (const participant of participants) {
    const display = await getParticipantDisplayName(participant.userId);
    if (display) {
      result.push({
        id: participant.id,
        role: participant.role,
        approved: participant.approved,
        requiresSignature: participant.requiresSignature,
        signedAt: participant.signedAt,
        display,
      });
    }
  }

  return result;
}

/**
 * Vérifie si tous les approvers d'un contrat ont approuvé
 * 
 * @param contractId - ID du contrat
 * @returns true si tous les approvers ont approuvé
 */
export async function areAllApproversApproved(
  contractId: string
): Promise<boolean> {
  const approvers = await prisma.contractParticipant.findMany({
    where: {
      contractId,
      role: "approver",
      isActive: true,
    },
  });

  if (approvers.length === 0) {
    return false;
  }

  return approvers.every((approver) => approver.approved);
}

/**
 * Vérifie si toutes les signatures requises d'un contrat sont présentes
 * 
 * @param contractId - ID du contrat
 * @returns true si toutes les signatures sont présentes
 */
export async function areAllSignaturesComplete(
  contractId: string
): Promise<boolean> {
  const participants = await prisma.contractParticipant.findMany({
    where: {
      contractId,
      requiresSignature: true,
      isActive: true,
    },
  });

  if (participants.length === 0) {
    return false;
  }

  return participants.every(
    (participant) => participant.signedAt !== null
  );
}
