/**
 * Helper pour créer des participants minimaux pour les contrats simplifiés
 * 
 * Ce helper assure que les participants sont créés correctement avec les
 * règles de validation appropriées (ex: approvers ne peuvent pas signer).
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface CreateMinimalParticipantInput {
  contractId: string;
  userId?: string;
  companyId?: string;
  role: string;
  isPrimary?: boolean;
  requiresSignature?: boolean;
  approved?: boolean;
}

/**
 * Crée un participant minimal pour un contrat simplifié
 * 
 * Règles de validation :
 * - Soit userId, soit companyId doit être fourni (au moins un)
 * - Par défaut: isActive=true, approved=false, requiresSignature=false
 * - Les approvers ne peuvent JAMAIS avoir requiresSignature=true
 * 
 * @param prisma - Instance Prisma Client
 * @param input - Données du participant
 * @returns Participant créé
 * @throws TRPCError si validation échoue
 * 
 * @example
 * await createMinimalParticipant(prisma, {
 *   contractId: "clxxx123",
 *   companyId: "clyyy456",
 *   role: "client",
 *   isPrimary: true,
 * });
 */
export async function createMinimalParticipant(
  prisma: PrismaClient,
  input: CreateMinimalParticipantInput
) {
  const {
    contractId,
    userId,
    companyId,
    role,
    isPrimary = false,
    requiresSignature = false,
    approved = false,
  } = input;

  // Validation 1: Au moins userId ou companyId doit être fourni
  if (!userId && !companyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Au moins userId ou companyId doit être fourni pour créer un participant",
    });
  }

  // Validation 2: Les approvers ne peuvent JAMAIS avoir requiresSignature=true
  if (role === "approver" && requiresSignature) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Les approvers ne peuvent pas avoir requiresSignature=true. " +
               "Les approvers approuvent, ils ne signent pas.",
    });
  }

  // Créer le participant
  try {
    return await prisma.contractParticipant.create({
      data: {
        contractId,
        userId: userId || null,
        companyId: companyId || null,
        role,
        isPrimary,
        requiresSignature,
        approved,
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
  } catch (error) {
    console.error("[createMinimalParticipant] Error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Échec de la création du participant",
      cause: error,
    });
  }
}

/**
 * Crée automatiquement un participant "client" basé sur une company
 * 
 * Raccourci pour créer un client primaire sans signature requise.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param companyId - ID de la company
 * @returns Participant client créé
 * 
 * @example
 * await createClientParticipant(prisma, "clxxx123", "clyyy456");
 */
export async function createClientParticipant(
  prisma: PrismaClient,
  contractId: string,
  companyId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    companyId,
    role: "client",
    isPrimary: true,
    requiresSignature: false,
    approved: false,
  });
}

/**
 * Crée automatiquement un participant "contractor" basé sur un utilisateur
 * 
 * Raccourci pour créer un contractor primaire avec signature requise.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur contractor
 * @returns Participant contractor créé
 * 
 * @example
 * await createContractorParticipant(prisma, "clxxx123", "clzzz789");
 */
export async function createContractorParticipant(
  prisma: PrismaClient,
  contractId: string,
  userId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    userId,
    role: "contractor",
    isPrimary: true,
    requiresSignature: true,
    approved: false,
  });
}

/**
 * Crée un participant "approver" (admin interne qui approuve le contrat)
 * 
 * IMPORTANT: Les approvers n'ont jamais requiresSignature=true.
 * Ils approuvent via le champ "approved", ils ne signent pas.
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - ID du contrat
 * @param userId - ID de l'utilisateur approver
 * @returns Participant approver créé
 * 
 * @example
 * await createApproverParticipant(prisma, "clxxx123", "cladmin123");
 */
export async function createApproverParticipant(
  prisma: PrismaClient,
  contractId: string,
  userId: string
) {
  return createMinimalParticipant(prisma, {
    contractId,
    userId,
    role: "approver",
    isPrimary: false,
    requiresSignature: false, // ⚠️ CRITIQUE: Toujours false pour les approvers
    approved: false,
  });
}
