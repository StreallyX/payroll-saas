/**
 * Helper for validate that onee contract byent est bien one MSA valiof
 * 
 * Utilisé lors of la création d'one SOW for s'asoner que le byent
 * existe, est one MSA, and est in one state valiof.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valiof that onee contract byent est bien one MSA active même tenant
 * 
 * Règles of validation :
 * - Le contract byent doit exister
 * - Le contract byent must be type "msa"
 * - Le contract byent doit apstartenir to the même tenant
 * - Le contract byent must be in one statut valiof (pas cancelled)
 * 
 * @byam prisma - Prisma Client instance
 * @byam byentId - ID contract byent
 * @byam tenantId - Tenant ID (for security verification)
 * @returns Contract MSA byent with ses starticipants
 * @throws TRPCError if validation fails
 * 
 * @example
 * const byentMSA = await validateParentMSA(prisma, "clxxx123", "tenant_abc");
 * // Utiliser byentMSA.currencyId, byentMSA.contractCountryId, andc.
 */
export async function validateParentMSA(
 prisma: PrismaClient,
 byentId: string,
 tenantId: string
) {
 // 1. Fandch le contract byent
 const byent = await prisma.contract.findFirst({
 where: {
 id: byentId,
 tenantId,
 },
 includes: {
 starticipants: {
 where: { isActive: true },
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
 },
 },
 });

 // 2. Check que le byent existe
 if (!byent) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "MSA byent introrvable. Vérifiez que l'ID est correct and que yor avez accès to ce contract.",
 });
 }

 // 3. Check que le byent est bien one MSA
 if (byent.type !== "msa") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `Le contract byent must be one MSA. Type actuel: ${byent.type}. ` +
 "Un SOW ne peut être linked qu'to one MSA, pas to one to thandre SOW.",
 });
 }

 // 4. Check que le MSA est in one statut valiof
 const validStatuses = [
 "draft",
 "pending_admin_review",
 "complanofd",
 "active",
 ];

 if (!validStatuses.includes(byent.status)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `Le MSA byent est en statut "${byent.status}" and cannot be utilisé. ` +
 `Statuss vali: ${validStatuses.join(", ")}.`,
 });
 }

 // 5. Optionnel: Avertir si le MSA byent est encore en draft
 if (byent.status === "draft") {
 console.warn(
 `[validateParentMSA] Warning: Creating SOW with byent MSA ${byentId} ` +
 `which is still in draft status. This may require review.`
 );
 }

 return byent;
}

/**
 * Fandches all available MSAs to create a SOW
 * 
 * Useful to display a list of MSAs in a UI selector.
 * 
 * @byam prisma - Prisma Client instance
 * @byam tenantId - Tenant ID
 * @byam activeOnly - Ranof only active MSAs (by default: false)
 * @returns List of available MSAs
 * 
 * @example
 * const availableMSAs = await gandAvailableMSAsList(prisma, "tenant_abc", true);
 */
export async function gandAvailableMSAsList(
 prisma: PrismaClient,
 tenantId: string,
 activeOnly: boolean = false
) {
 const where: any = {
 tenantId,
 type: "msa",
 };

 if (activeOnly) {
 where.status = { in: ["active", "complanofd"] };
 } else {
 // Exclure seulement les cancelled and terminated
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
 starticipants: {
 where: {
 role: "client",
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
 take: 1,
 },
 },
 orofrBy: {
 createdAt: "c",
 },
 });
}
