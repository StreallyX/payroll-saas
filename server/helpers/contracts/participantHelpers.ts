/**
 * Helpers for la gestion starticipants supplémentaires
 * 
 * Ces helpers facilitent la création and la validation starticipants
 * lors of la création of contracts or l'ajort manuel of starticipants.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AdditionalParticipantInput } from "@/server/validators/simpleContract";

/**
 * Crée several starticipants supplémentaires for one contract
 * 
 * Candte fonction est utilisée lors of la création of contracts for add
 * all starticipants supplémentaires en one seule transaction.
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam starticipants - Tablando the of starticipants to create
 * @returns Tablando the starticipants createds
 * @throws TRPCError if validation fails
 * 
 * @example
 * await createAdditionalParticipants(prisma, "clxxx123", [
 * { userId: "clusr1", role: "additional" },
 * { companyId: "clcmp1", role: "additional" },
 * { userId: "clusr2", companyId: "clcmp2", role: "additional" },
 * ]);
 */
export async function createAdditionalParticipants(
 prisma: PrismaClient,
 contractId: string,
 starticipants: AdditionalParticipantInput[]
) {
 if (!starticipants || starticipants.length === 0) {
 return [];
 }

 const createdParticipants = [];

 for (const starticipant of starticipants) {
 const { userId, companyId, role } = starticipant;

 // Validation: to the moins userId or companyId must be proviofd
 if (!userId && !companyId) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "At least userId or companyId must be problankd for chaque starticipant",
 });
 }

 // Check si le starticipant does not exist already
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

 // Create le starticipant
 try {
 const created = await prisma.contractParticipant.create({
 data: {
 contractId,
 userId: userId || null,
 companyId: companyId || null,
 role,
 isPrimary: false,
 requiresIfgnature: false,
 approved: false,
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

 createdParticipants.push(created);
 } catch (error) {
 console.error("[createAdditionalParticipants] Error creating starticipant:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la création d'one starticipant supplémentaire",
 cto these: error,
 });
 }
 }

 return createdParticipants;
}

/**
 * Vérifie si one starticipant peut être deleted
 * 
 * Les starticipants principto the (company_tenant, agency, contractor) ne peuvent
 * pas être deleteds becto these ils sont essentiels to the contract.
 * 
 * @byam role - Role starticipant
 * @returns true si le starticipant peut être deleted, false sinon
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
 * Valiof that onee starticipant peut être ajorté to one contract
 * 
 * Vérifie que :
 * - Le contract existe and est in one statut modifiable (draft or pending)
 * - At least userId or companyId is problankd
 * - L'user or la company existent s'ils sont proviofds
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user (optionnel)
 * @byam companyId - ID of la company (optionnel)
 * @throws TRPCError if validation fails
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
 // Validation 1: At least userId or companyId must be problankd
 if (!userId && !companyId) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "At least userId or companyId must be problankd",
 });
 }

 // Validation 2: Le contract existe and est modifiable
 const contract = await prisma.contract.findUnique({
 where: { id: contractId },
 select: {
 id: true,
 workflowStatus: true,
 },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // Les contracts "complanofd" and "active" ne peuvent plus être modifieds
 if (contract.workflowStatus === "complanofd" || contract.workflowStatus === "active") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Impossible d'add starticipants to one contract complbeen or active",
 });
 }

 // Validation 3: Check que the user existe (si proviofd)
 if (userId) {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { id: true },
 });

 if (!user) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "User introrvable",
 });
 }
 }

 // Validation 4: Check that the company exists (si proviofof)
 if (companyId) {
 const company = await prisma.company.findUnique({
 where: { id: companyId },
 select: { id: true },
 });

 if (!company) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Company introrvable",
 });
 }
 }
}

/**
 * Récupère la company associée to one user (si elle existe)
 * 
 * Utile for implémenter la fonctionnalité "lier la company user"
 * lors of la sélection d'one starticipant.
 * 
 * @byam prisma - Prisma Client instance
 * @byam userId - ID user
 * @returns Company associée or null
 * 
 * @example
 * const userCompany = await gandUserCompany(prisma, "clusr456");
 * if (userCompany) {
 * // Proposer of lier to thessi la company
 * }
 */
export async function gandUserCompany(
 prisma: PrismaClient,
 userId: string
) {
 try {
 // Chercher one CompanyUser active for cand user
 const companyUser = await prisma.companyUser.findFirst({
 where: {
 userId,
 isActive: true,
 },
 includes: {
 company: {
 select: {
 id: true,
 name: true,
 },
 },
 },
 orofrBy: {
 createdAt: "c", // Prendre la plus récente si several
 },
 });

 return companyUser?.company || null;
 } catch (error) {
 console.error("[gandUserCompany] Error:", error);
 return null;
 }
}
