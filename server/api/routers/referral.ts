
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { hasPermission } from "../trpc"
import { PERMISSION_TREE } from "../../rbac/permissions"
import { TRPCError } from "@trpc/server"
import { nanoid } from "nanoid"

export const referralRouter = createTRPCRouter({
  
  // Get contractor's referral code
  getMyReferralCode: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.referrals.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      // Generate a referral code based on contractor ID (or retrieve existing one)
      const referralCode = `REF-${user.contractor.id.substring(0, 8).toUpperCase()}`
      
      return {
        referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`
      }
    }),
  
  // Get contractor's referrals
  getMyReferrals: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.referrals.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      return ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerId: user.contractor.id
        },
        include: {
          referredContractor: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }),
  
  // Send referral invitation
  sendReferralInvitation: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.referrals.create))
    .input(z.object({
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
      personalMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      // Check if email already referred
      const existing = await ctx.prisma.referral.findFirst({
        where: {
          tenantId: ctx.tenantId,
          referrerId: user.contractor.id,
          referredEmail: input.referredEmail,
          status: { in: ['invited', 'signed_up', 'hired', 'completed'] }
        }
      })
      
      if (existing) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "You have already referred this email" 
        })
      }
      
      // Generate unique referral code
      const referralCode = `REF-${nanoid(10).toUpperCase()}`
      
      // Create referral
      const referral = await ctx.prisma.referral.create({
        data: {
          tenantId: ctx.tenantId,
          referrerId: user.contractor.id,
          referralCode,
          referredEmail: input.referredEmail,
          referredName: input.referredName,
          personalMessage: input.personalMessage,
          status: 'invited',
        }
      })
      
      // TODO: Send referral invitation email
      // await sendReferralInvitationEmail({
      //   to: input.referredEmail,
      //   referrerName: user.contractor.name,
      //   personalMessage: input.personalMessage,
      //   referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`
      // })
      
      return referral
    }),
  
  // Get referral statistics
  getMyReferralStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.referrals.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })
      }
      
      const referrals = await ctx.prisma.referral.findMany({
        where: {
          tenantId: ctx.tenantId,
          referrerId: user.contractor.id
        }
      })
      
      const totalRewards = referrals
        .filter(r => r.rewardStatus === 'paid')
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0)
      
      const pendingRewards = referrals
        .filter(r => r.rewardStatus === 'earned')
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0)
      
      const successfulHires = referrals.filter(r => r.status === 'hired' || r.status === 'completed').length
      
      return {
        totalRewards,
        pendingRewards,
        totalReferrals: referrals.length,
        successfulHires,
        byStatus: {
          invited: referrals.filter(r => r.status === 'invited').length,
          signedUp: referrals.filter(r => r.status === 'signed_up').length,
          hired: referrals.filter(r => r.status === 'hired').length,
          completed: referrals.filter(r => r.status === 'completed').length,
          rejected: referrals.filter(r => r.status === 'rejected').length,
        }
      }
    }),
  
  // Track referral status
  trackReferral: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.referrals.track))
    .input(z.object({
      referralId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      const referral = await ctx.prisma.referral.findFirst({
        where: {
          id: input.referralId,
          referrerId: user?.contractor?.id,
          tenantId: ctx.tenantId
        },
        include: {
          referredContractor: {
            select: {
              name: true,
              email: true,
              status: true,
              createdAt: true
            }
          }
        }
      })
      
      if (!referral) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Referral not found" 
        })
      }
      
      return referral
    }),
})
