
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc";

/**
 * Vérifie que l'utilisateur accède uniquement à ses propres ressources
 * Utile pour les contractors qui ne peuvent voir que leurs propres données
 */
export async function enforceOwnership(
  ctx: TRPCContext,
  resourceType: "contractor" | "agency" | "payrollPartner",
  resourceId: string
): Promise<void> {
  const user = ctx.session?.user;

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Super admin et admin ont accès à tout
  if (user.isSuperAdmin || user.roleName === "admin" || user.roleName === "Tenant Admin") {
    return;
  }

  // Vérifier selon le type de ressource
  switch (resourceType) {
    case "contractor": {
      const contractor = await ctx.prisma.contractor.findUnique({
        where: { id: resourceId },
      });

      if (!contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found",
        });
      }

      if (contractor.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access your own contractor profile",
        });
      }
      break;
    }
    
    case "agency": {
      // Vérifier que l'utilisateur appartient à cette agence
      const agencyUser = await ctx.prisma.user.findFirst({
        where: {
          id: user.id,
          agencyId: resourceId,
        },
      });

      if (!agencyUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access your own agency",
        });
      }
      break;
    }
    
    case "payrollPartner": {
      // Vérifier que l'utilisateur appartient à ce partenaire payroll
      const payrollUser = await ctx.prisma.user.findFirst({
        where: {
          id: user.id,
          payrollPartnerId: resourceId,
        },
      });

      if (!payrollUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access your own payroll partner",
        });
      }
      break;
    }
  }
}

/**
 * Filtre automatique pour les requêtes selon le contexte de l'utilisateur
 */
export function getScopedFilter(ctx: TRPCContext): any {
  const user = ctx.session?.user;

  if (!user) {
    return { id: "impossible" }; // Retourne un filtre qui ne matche rien
  }

  // Super admin et admin voient tout dans leur tenant
  if (user.isSuperAdmin || user.roleName === "admin" || user.roleName === "Tenant Admin") {
    return { tenantId: ctx.tenantId };
  }

  // Contractor ne voit que ses propres données
  if (user.roleName === "contractor" || user.roleName === "Contractor") {
    return {
      tenantId: ctx.tenantId,
      OR: [
        { userId: user.id },
        { contractorId: user.id },
      ],
    };
  }

  // Agency user ne voit que les données de son agence
  if (user.agencyId) {
    return {
      tenantId: ctx.tenantId,
      agencyId: user.agencyId,
    };
  }

  // Payroll partner user ne voit que ses données
  if (user.payrollPartnerId) {
    return {
      tenantId: ctx.tenantId,
      payrollPartnerId: user.payrollPartnerId,
    };
  }

  // Par défaut, filtre par tenant
  return { tenantId: ctx.tenantId };
}
