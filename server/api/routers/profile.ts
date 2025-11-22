import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";

// ---------------------------------------------------------
// RBAC PERMISSIONS (V3 STYLE)
// ---------------------------------------------------------
const VIEW_OWN = buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN);
const UPDATE_OWN = buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN);

export const profileRouter = createTRPCRouter({

  // =========================================================
  // GET OWN PROFILE (USER + COMPANIES + BANK + DOCUMENTS)
  // =========================================================
  getOwn: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      // USER
      const user = await ctx.prisma.user.findFirst({
        where: { id: userId, tenantId },
        include: {
          role: true,
        },
      });

      if (!user) throw new Error("User not found.");

      // ALL COMPANIES user belongs to via CompanyUser
      const memberships = await ctx.prisma.companyUser.findMany({
        where: { userId },
        include: {
          company: {
            include: { country: true },
          },
        },
      });

      const companies = memberships.map((m) => m.company);

      // BANK created by user
      const bank = await ctx.prisma.bank.findFirst({
        where: { tenantId, createdBy: userId },
      });

      // DOCUMENTS uploaded by user
      const documents = await ctx.prisma.contractDocument.findMany({
        where: { uploadedBy: userId },
        orderBy: { uploadedAt: "desc" },
      });

      return {
        user,
        companies,
        bank,
        documents,
      };
    }),

  // =========================================================
  // UPDATE OWN USER PROFILE
  // =========================================================
  updateOwn: tenantProcedure
    .use(hasPermission(UPDATE_OWN))
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().nullable().optional(),
        timezone: z.string().nullable().optional(),
        language: z.string().nullable().optional(),
        profilePictureUrl: z.string().nullable().optional(),
        preferences: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      const updated = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          phone: input.phone ?? null,
          timezone: input.timezone ?? undefined,
          language: input.language ?? undefined,
          profilePictureUrl: input.profilePictureUrl ?? undefined,
          preferences: input.preferences ?? undefined,
          lastActivityAt: new Date(),
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.roleName,
          action: "PROFILE_UPDATE",
          entityType: "profile",
          entityId: userId,
          entityName: updated.name || "User",
          description: "User updated own profile",
        },
      });

      return updated;
    }),

  // =========================================================
  // UPSERT COMPANY (CREATE OR UPDATE)
  // =========================================================
  upsertCompany: tenantProcedure
    .use(hasPermission(UPDATE_OWN))
    .input(
      z.object({
        companyId: z.string().optional(), // NEW FIELD
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().optional(),
        alternateInvoicingEmail: z.string().optional(),
        vatNumber: z.string().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      // Case 1: CREATE NEW COMPANY
      if (!input.companyId) {

        // 🚀 Solution 1 : remove invalid countryId
        if (!input.countryId) {
          delete input.countryId; 
        }

        const newCompany = await ctx.prisma.company.create({
          data: {
            ...input,
            tenantId,
            createdBy: userId,
          },
        });

        // Link user → company as OWNER
        await ctx.prisma.companyUser.create({
          data: {
            userId,
            companyId: newCompany.id,
            role: "owner",
          },
        });

        return newCompany;
      }


      // Case 2: UPDATE EXISTING COMPANY (only if user belongs to it)
      const membership = await ctx.prisma.companyUser.findFirst({
        where: { companyId: input.companyId, userId },
      });

      if (!membership) {
        throw new Error("You do not have permissions to update this company");
      }

      const { companyId, ...data } = input;

      return ctx.prisma.company.update({
        where: { id: companyId },
        data,
      });
    }),

  // =========================================================
  // UPSERT BANK (CREATE OR UPDATE)
  // =========================================================
  upsertBank: tenantProcedure
    .use(hasPermission(UPDATE_OWN))
    .input(
      z.object({
        name: z.string().min(1),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      const bank = await ctx.prisma.bank.findFirst({
        where: {
          tenantId,
          createdBy: userId,
        },
      });

      if (!bank) {
        return ctx.prisma.bank.create({
          data: {
            tenantId,
            createdBy: userId,
            ...input,
          },
        });
      }

      return ctx.prisma.bank.update({
        where: { id: bank.id },
        data: input,
      });
    }),
});
