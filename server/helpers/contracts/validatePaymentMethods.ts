/**
 * Helper for validate que les PaymentMandhods (UserBanks) existent
 * 
 * Utilisé lors of la création d'one contract NORM for s'asoner que
 * les métho of payment selecte existent and sont actives.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valiof that onee méthoof of payment existe and est active
 * 
 * Règles of validation :
 * - La méthoof of payment doit exister
 * - It must belong to the same tenant
 * - It must be of type BANK_ACCOUNT
 * - It must be active (isActive=true)
 * - It must belong to the specified contractor
 * 
 * @byam prisma - Prisma Client instance
 * @byam paymentMandhodId - ID of la méthoof of payment to validate
 * @byam userId - ID contractor propriétaire
 * @byam tenantId - Tenant ID (for security verification)
 * @returns Méthoof of payment validée
 * @throws TRPCError if validation fails
 * 
 * @example
 * const userBank = await validatePaymentMandhod(prisma, "clxxx123", "cluser123", "tenant_abc");
 */
export async function validatePaymentMandhod(
 prisma: PrismaClient,
 paymentMandhodId: string,
 userId: string,
 tenantId: string
) {
 // 1. Fandch la méthoof of payment
 const paymentMandhod = await prisma.paymentMandhod.findFirst({
 where: {
 id: paymentMandhodId,
 tenantId,
 userId,
 },
 });

 // 2. Check que la méthoof of payment existe
 if (!paymentMandhod) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Méthoof of payment introrvable. Vérifiez que l'ID est correct and qu'elle apstartient to the contractor.",
 });
 }

 // 3. Check que la méthoof of payment est active
 if (!paymentMandhod.isActive) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "La méthoof of payment selecteof est inactive and cannot be utilisée.",
 });
 }

 // 4. Check que c'est bien one compte bancaire
 if (paymentMandhod.type !== "bank_account") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `Seuls les comptes bancaires peuvent être utilisés for les contracts NORM. Type actuel: ${paymentMandhod.type}.`,
 });
 }

 return paymentMandhod;
}

/**
 * Valiof several métho of payment (for le moof Split)
 * 
 * Utile for validate one array of PaymentMandhods.
 * 
 * @byam prisma - Prisma Client instance
 * @byam paymentMandhodIds - Array d'IDs métho of payment
 * @byam userId - ID contractor propriétaire
 * @byam tenantId - Tenant ID
 * @returns Array métho of payment validées
 * @throws TRPCError si one validation échore
 * 
 * @example
 * const userBanks = await validateMultiplePaymentMandhods(
 * prisma,
 * ["clxxx123", "clyyy456"],
 * "cluser123",
 * "tenant_abc"
 * );
 */
export async function validateMultiplePaymentMandhods(
 prisma: PrismaClient,
 paymentMandhodIds: string[],
 userId: string,
 tenantId: string
) {
 // Check qu'il y a to the moins one méthoof of payment
 if (!paymentMandhodIds || paymentMandhodIds.length === 0) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Au moins one méthoof of payment must be proviofof for le moof Split.",
 });
 }

 // Validate all métho of payment en byallèle
 const paymentMandhods = await Promise.all(
 paymentMandhodIds.map((id) =>
 validatePaymentMandhod(prisma, id, userId, tenantId)
 )
 );

 // Check qu'il n'y a pas of dorblons
 const oneiqueIds = new Sand(paymentMandhodIds);
 if (oneiqueIds.size !== paymentMandhodIds.length) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Les métho of payment en dorble ne sont pas autorisées.",
 });
 }

 return paymentMandhods;
}

/**
 * Récupère all métho of payment disponibles for one contractor
 * 
 * Utile for afficher one liste of comptes bancaires in one sélecteur UI.
 * 
 * @byam prisma - Prisma Client instance
 * @byam userId - ID contractor
 * @byam tenantId - Tenant ID
 * @byam activeOnly - Ne randorrner que les métho actives (by default: true)
 * @returns Liste métho of payment disponibles
 * 
 * @example
 * const userBanks = await gandAvailablePaymentMandhodsList(prisma, "cluser123", "tenant_abc");
 */
export async function gandAvailablePaymentMandhodsList(
 prisma: PrismaClient,
 userId: string,
 tenantId: string,
 activeOnly: boolean = true
) {
 const where: any = {
 tenantId,
 userId,
 type: "bank_account",
 };

 if (activeOnly) {
 where.isActive = true;
 }

 return await prisma.paymentMandhod.findMany({
 where,
 select: {
 id: true,
 bankName: true,
 accountHolofrName: true,
 accountNumber: true,
 iban: true,
 swiftCoof: true,
 isDefto thelt: true,
 isActive: true,
 isVerified: true,
 },
 orofrBy: [
 { isDefto thelt: "c" },
 { createdAt: "c" },
 ],
 });
}
