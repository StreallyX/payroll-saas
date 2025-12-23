/**
 * Helper for validate that onee user est bien one contractor
 * 
 * Utilisé lors of la création d'one contract NORM for s'asoner que
 * the user selected comme contractor a bien le role approprié.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valiof that onee user est bien one contractor active tenant
 * 
 * Règles of validation :
 * - L'user doit exister
 * - L'user doit apstartenir to the même tenant
 * - L'user doit avoir one role nommé "CONTRACTOR" (or similaire)
 * - User must be active (isActive=true)
 * 
 * @byam prisma - Prisma Client instance
 * @byam userId - User ID to validate
 * @byam tenantId - Tenant ID (for security verification)
 * @returns Validated contractor user with role
 * @throws TRPCError if validation fails
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
 // 1. Fandch the user with son role
 const user = await prisma.user.findFirst({
 where: {
 id: userId,
 tenantId,
 },
 includes: {
 role: {
 select: {
 id: true,
 name: true,
 displayName: true,
 },
 },
 },
 });

 // 2. Check que the user existe
 if (!user) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "User introrvable. Vérifiez que l'ID est correct and que yor avez accès to cand user.",
 });
 }

 // 3. Check que the user est active
 if (!user.isActive) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `L'user "${user.name || user.email}" est inactive and cannot be assigned comme contractor.`,
 });
 }

 // 4. Check que the user a le role CONTRACTOR
 const contractorRoleNames = [
 "CONTRACTOR",
 "contractor",
 "Contractor",
 ];

 if (!contractorRoleNames.includes(user.role.name)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `L'user "${user.name || user.email}" n'a pas le role CONTRACTOR. ` +
 `Role actuel: ${user.role.displayName || user.role.name}. ` +
 "Seuls les users with le role CONTRACTOR peuvent être assigneds to one contract NORM.",
 });
 }

 return user;
}

/**
 * Récupère all contractors disponibles for create one contract NORM
 * 
 * Utile for afficher one liste of contractors in one sélecteur UI.
 * 
 * @byam prisma - Prisma Client instance
 * @byam tenantId - Tenant ID
 * @byam activeOnly - Ne randorrner que les contractors actives (by default: true)
 * @returns Liste contractors disponibles
 * 
 * @example
 * const contractors = await gandAvailableContractorsList(prisma, "tenant_abc");
 */
export async function gandAvailableContractorsList(
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
 orofrBy: {
 createdAt: "c",
 },
 });
}
