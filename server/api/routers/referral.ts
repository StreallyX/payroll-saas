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

// RBAC KEYS
const REFERRAL_VIEW_OWN = buildPermissionKey(Resource.REFERRAL, Action.READ, PermissionScope.OWN);
const REFERRAL_CREATE_OWN = buildPermissionKey(Resource.REFERRAL, Action.CREATE, PermissionScope.OWN);

export const referralRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // 1. GET MY REFERRAL CODE
  // ---------------------------------------------------------
  getMyReferralCode: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      return {
        referralCode: `REF-${userId.substring(0, 8).toUpperCase()}`,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=REF-${userId.substring(0, 8).toUpperCase()}`,
      };
    }),

  // ---------------------------------------------------------
  // 2. GET MY REFERRALS
  // ---------------------------------------------------------
  getMyReferrals: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerUserId: ctx.session.user.id,
        },
        include: {
          referredUser: {
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

  // ---------------------------------------------------------
  // 3. SEND INVITATION
  // ---------------------------------------------------------
  sendReferralInvitation: tenantProcedure
    .use(hasPermission(REFERRAL_CREATE_OWN))
    .input(z.object({
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
      personalMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // prevent duplicates
      const existing = await ctx.prisma.referral.findFirst({
        where: {
          tenantId: ctx.tenantId,
          referrerUserId: userId,
          referredEmail: input.referredEmail,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already referred this email.",
        });
      }

      return ctx.prisma.referral.create({
        data: {
          tenantId: ctx.tenantId,
          referrerUserId: userId,
          referredEmail: input.referredEmail,
          referredName: input.referredName,
          status: "pending",
        },
      });
    }),

  // ---------------------------------------------------------
  // 4. GET MY REFERRAL STATS
  // ---------------------------------------------------------
  getMyReferralStats: tenantProcedure
    .use(hasPermission(REFERRAL_VIEW_OWN))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const referrals = await ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerUserId: userId,
        },
      });

      const totalRewards = referrals
        .filter(r => r.rewardPaidAt)
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);

      return {
        totalRewards,
        pendingRewards: referrals.filter(r => r.status === "rewarded")
          .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0),
        totalReferrals: referrals.length,
        byStatus: {
          pending: referrals.filter(r => r.status === "pending").length,
          accepted: referrals.filter(r => r.status === "accepted").length,
          rejected: referrals.filter(r => r.status === "rejected").length,
          rewarded: referrals.filter(r => r.status === "rewarded").length,
        },
      };
    }),
});
