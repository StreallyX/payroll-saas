import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { hasPermission } from "../trpc";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";
import { TRPCError } from "@trpc/server";

// RBAC keys
const REFERRAL_VIEW_OWN = buildPermissionKey(Resource.REFERRAL, Action.READ, PermissionScope.OWN);
const REFERRAL_CREATE_OWN = buildPermissionKey(Resource.REFERRAL, Action.CREATE, PermissionScope.OWN);

export const referralRouter = createTRPCRouter({

  // ---------------------------------------------
  // GET CONTRACTOR REFERRAL CODE
  // ---------------------------------------------
  getMyReferralCode: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      // Simple code based on contractor ID
      const referralCode = `REF-${user.contractor.id.substring(0, 8).toUpperCase()}`;

      return {
        referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
      };
    }),

  // ---------------------------------------------
  // GET CONTRACTOR REFERRALS
  // ---------------------------------------------
  getMyReferrals: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      return ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerContractorId: user.contractor.id,
        },
        include: {
          referredContractor: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ---------------------------------------------
  // SEND REFERRAL INVITATION
  // ---------------------------------------------
  sendReferralInvitation: tenantProcedure
    .use(hasPermission(REFERRAL_CREATE_OWN))
    .input(z.object({
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      // Check duplicates
      const existing = await ctx.prisma.referral.findFirst({
        where: {
          tenantId: ctx.tenantId,
          referrerContractorId: user.contractor.id,
          referredEmail: input.referredEmail,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already referred this email",
        });
      }

      // Create referral — ONLY FIELDS THAT EXIST IN PRISMA
      return ctx.prisma.referral.create({
        data: {
          tenantId: ctx.tenantId,
          referrerContractorId: user.contractor.id,
          referredEmail: input.referredEmail,
          referredName: input.referredName,
          status: "pending",     // valid in your schema
        },
      });
    }),

  // ---------------------------------------------
  // REFERRAL STATISTICS
  // ---------------------------------------------
  getMyReferralStats: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found",
        });
      }

      const referrals = await ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerContractorId: user.contractor.id,
        },
      });

      // SAFE: rewardAmount exists
      const totalRewards = referrals
        .filter(r => r.rewardPaidAt !== null)
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);

      const pendingRewards = referrals
        .filter(r => r.status === "rewarded")
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);

      return {
        totalRewards,
        pendingRewards,
        totalReferrals: referrals.length,

        byStatus: {
          pending: referrals.filter(r => r.status === "pending").length,
          accepted: referrals.filter(r => r.status === "accepted").length,
          rejected: referrals.filter(r => r.status === "rejected").length,
          rewarded: referrals.filter(r => r.status === "rewarded").length,
        }
      };
    }),

  // ---------------------------------------------
  // TRACK REFERRAL
  // ---------------------------------------------
  trackReferral: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .input(z.object({ referralId: z.string() }))
    .query(async ({ ctx, input }) => {

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      const referral = await ctx.prisma.referral.findFirst({
        where: {
          id: input.referralId,
          referrerContractorId: user?.contractor?.id,
          tenantId: ctx.tenantId,
        },
        include: {
          referredContractor: {
            select: {
              name: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!referral) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral not found",
        });
      }

      return referral;
    }),
});
