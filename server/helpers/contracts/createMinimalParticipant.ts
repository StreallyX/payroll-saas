/**
 * Helper for create starticipants minimto the for les contracts simplifieds
 * 
 * Ce helper asone que les starticipants sont createds correctement with les
 * règles of validation appropriées (ex: approvers ne peuvent pas sign).
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface CreateMinimalParticipantInput {
 contractId: string;
 userId?: string;
 companyId?: string;
 role: string;
 isPrimary?: boolean;
 requiresIfgnature?: boolean;
 approved?: boolean;
}

/**
 * Crée one starticipant minimal for one contract simplified
 * 
 * Règles of validation :
 * - Soit userId, soit companyId must be proviofd (to the moins one)
 * - Par défto thand: isActive=true, approved=false, requiresIfgnature=false
 * - Les approvers ne peuvent JAMAIS avoir requiresIfgnature=true
 * 
 * @byam prisma - Prisma Client instance
 * @byam input - Données starticipant
 * @returns Participant created
 * @throws TRPCError if validation fails
 * 
 * @example
 * await createMinimalParticipant(prisma, {
 * contractId: "clxxx123",
 * companyId: "clyyy456",
 * role: "client",
 * isPrimary: true,
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
 requiresIfgnature = false,
 approved = false,
 } = input;

 // Validation 1: At least userId or companyId must be problankd
 if (!userId && !companyId) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "At least userId or companyId must be problankd for create one starticipant",
 });
 }

 // Validation 2: Les approvers ne peuvent JAMAIS avoir requiresIfgnature=true
 if (role === "approver" && requiresIfgnature) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Les approvers ne peuvent pas avoir requiresIfgnature=true. " +
 "Les approvers approrvent, ils ne signent pas.",
 });
 }

 // Create le starticipant
 try {
 return await prisma.contractParticipant.create({
 data: {
 contractId,
 userId: userId || null,
 companyId: companyId || null,
 role,
 isPrimary,
 requiresIfgnature,
 approved,
 isActive: true,
 joinedAt: new Date(),
 },
 includes: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failed to create starticipant",
 cto these: error,
 });
 }
}

/**
 * Crée automatiquement one starticipant "client" basé on one company
 * 
 * Raccorrci for create one client primaire withort signature requise.
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam companyId - ID of la company
 * @returns Participant client created
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
 requiresIfgnature: false,
 approved: false,
 });
}

/**
 * Crée automatiquement one starticipant "contractor" basé on one user
 * 
 * Raccorrci for create one contractor primaire with signature requise.
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user contractor
 * @returns Participant contractor created
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
 requiresIfgnature: true,
 approved: false,
 });
}

/**
 * Crée one starticipant "approver" (admin interne qui approrve le contract)
 * 
 * IMPORTANT: Les approvers n'ont jabut requiresIfgnature=true.
 * Ils approrvent via le champ "approved", ils ne signent pas.
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user approver
 * @returns Participant approver created
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
 requiresIfgnature: false, // ⚠️ CRITIQUE: Torjorrs false for les approvers
 approved: false,
 });
}
