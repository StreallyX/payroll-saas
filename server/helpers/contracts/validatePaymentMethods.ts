/**
 * Helper pour valider que les PaymentMethods (UserBanks) existent
 * 
 * Utilisé lors de la création d'un contrat NORM pour s'assurer que
 * les méthodes de paiement sélectionnées existent et sont actives.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valide qu'une méthode de paiement existe et est active
 * 
 * Règles de validation :
 * - La méthode de paiement doit exister
 * - Elle doit appartenir au même tenant
 * - Elle doit être de type BANK_ACCOUNT
 * - Elle doit être active (isActive=true)
 * - Elle doit appartenir au contractor spécifié
 * 
 * @param prisma - Instance Prisma Client
 * @param paymentMethodId - ID de la méthode de paiement à valider
 * @param userId - ID du contractor propriétaire
 * @param tenantId - ID du tenant (pour vérification de sécurité)
 * @returns Méthode de paiement validée
 * @throws TRPCError si validation échoue
 * 
 * @example
 * const userBank = await validatePaymentMethod(prisma, "clxxx123", "cluser123", "tenant_abc");
 */
export async function validatePaymentMethod(
  prisma: PrismaClient,
  paymentMethodId: string,
  userId: string,
  tenantId: string
) {
  // 1. Récupérer la méthode de paiement
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      tenantId,
      userId,
    },
  });

  // 2. Vérifier que la méthode de paiement existe
  if (!paymentMethod) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Méthode de paiement introuvable. Vérifiez que l'ID est correct et qu'elle appartient au contractor.",
    });
  }

  // 3. Vérifier que la méthode de paiement est active
  if (!paymentMethod.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "La méthode de paiement sélectionnée est inactive et ne peut pas être utilisée.",
    });
  }

  // 4. Vérifier que c'est bien un compte bancaire
  if (paymentMethod.type !== "bank_account") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Seuls les comptes bancaires peuvent être utilisés pour les contrats NORM. Type actuel: ${paymentMethod.type}.`,
    });
  }

  return paymentMethod;
}

/**
 * Valide plusieurs méthodes de paiement (pour le mode Split)
 * 
 * Utile pour valider un array de PaymentMethods.
 * 
 * @param prisma - Instance Prisma Client
 * @param paymentMethodIds - Array d'IDs des méthodes de paiement
 * @param userId - ID du contractor propriétaire
 * @param tenantId - ID du tenant
 * @returns Array des méthodes de paiement validées
 * @throws TRPCError si une validation échoue
 * 
 * @example
 * const userBanks = await validateMultiplePaymentMethods(
 *   prisma,
 *   ["clxxx123", "clyyy456"],
 *   "cluser123",
 *   "tenant_abc"
 * );
 */
export async function validateMultiplePaymentMethods(
  prisma: PrismaClient,
  paymentMethodIds: string[],
  userId: string,
  tenantId: string
) {
  // Vérifier qu'il y a au moins une méthode de paiement
  if (!paymentMethodIds || paymentMethodIds.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Au moins une méthode de paiement doit être fournie pour le mode Split.",
    });
  }

  // Valider toutes les méthodes de paiement en parallèle
  const paymentMethods = await Promise.all(
    paymentMethodIds.map((id) =>
      validatePaymentMethod(prisma, id, userId, tenantId)
    )
  );

  // Vérifier qu'il n'y a pas de doublons
  const uniqueIds = new Set(paymentMethodIds);
  if (uniqueIds.size !== paymentMethodIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Les méthodes de paiement en double ne sont pas autorisées.",
    });
  }

  return paymentMethods;
}

/**
 * Récupère toutes les méthodes de paiement disponibles pour un contractor
 * 
 * Utile pour afficher une liste de comptes bancaires dans un sélecteur UI.
 * 
 * @param prisma - Instance Prisma Client
 * @param userId - ID du contractor
 * @param tenantId - ID du tenant
 * @param activeOnly - Ne retourner que les méthodes actives (par défaut: true)
 * @returns Liste des méthodes de paiement disponibles
 * 
 * @example
 * const userBanks = await getAvailablePaymentMethodsList(prisma, "cluser123", "tenant_abc");
 */
export async function getAvailablePaymentMethodsList(
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

  return await prisma.paymentMethod.findMany({
    where,
    select: {
      id: true,
      bankName: true,
      accountHolderName: true,
      accountNumber: true,
      iban: true,
      swiftCode: true,
      isDefault: true,
      isActive: true,
      isVerified: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
}
