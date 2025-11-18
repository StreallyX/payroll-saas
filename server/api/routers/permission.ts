import { z } from "zod";
import { createTRPCRouter, tenantProcedure, protectedProcedure, hasPermission } from "../trpc";

export const permissionRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL PERMISSIONS
  // -------------------------------------------------------
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.permission.findMany({
        orderBy: { key: "asc" },
      });
    }),

  // -------------------------------------------------------
  // GET PERMISSION BY ID
  // -------------------------------------------------------
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.permission.findUnique({
        where: { id: input.id },
      });
    }),

  // -------------------------------------------------------
  // GET PERMISSIONS BY KEYS
  // -------------------------------------------------------
  getByKeys: protectedProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.permission.findMany({
        where: {
          key: {
            in: input.keys
          }
        }
      });
    }),

  // -------------------------------------------------------
  // GET CURRENT USER PERMISSIONS
  // -------------------------------------------------------
  getMyPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user) {
        return [];
      }

      // SuperAdmin has all permissions
      if (ctx.session.user.isSuperAdmin) {
        return ctx.session.user.permissions || [];
      }

      // Regular user
      return ctx.session.user.permissions || [];
    }),

  // -------------------------------------------------------
  // CHECK IF USER HAS PERMISSION
  // -------------------------------------------------------
  hasPermission: protectedProcedure
    .input(z.object({ 
      permission: z.string() 
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        return false;
      }

      const userPermissions = ctx.session.user.permissions || [];
      return userPermissions.includes(input.permission);
    }),

  // -------------------------------------------------------
  // CHECK IF USER HAS ANY OF THE PERMISSIONS
  // -------------------------------------------------------
  hasAnyPermission: protectedProcedure
    .input(z.object({ 
      permissions: z.array(z.string()) 
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        return false;
      }

      const userPermissions = ctx.session.user.permissions || [];
      return input.permissions.some(p => userPermissions.includes(p));
    }),

  // -------------------------------------------------------
  // CHECK IF USER HAS ALL PERMISSIONS
  // -------------------------------------------------------
  hasAllPermissions: protectedProcedure
    .input(z.object({ 
      permissions: z.array(z.string()) 
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        return false;
      }

      const userPermissions = ctx.session.user.permissions || [];
      return input.permissions.every(p => userPermissions.includes(p));
    }),

  // -------------------------------------------------------
  // GET PERMISSIONS GROUPED BY CATEGORY
  // -------------------------------------------------------
  getGrouped: protectedProcedure
    .query(async ({ ctx }) => {
      const permissions = await ctx.prisma.permission.findMany({
        orderBy: { key: "asc" },
      });

      // Group permissions by their prefix (e.g., "tenant", "agencies", etc.)
      const grouped: Record<string, any[]> = {};

      permissions.forEach(permission => {
        const parts = permission.key.split(".");
        const category = parts[0];

        if (!grouped[category]) {
          grouped[category] = [];
        }

        grouped[category].push(permission);
      });

      return Object.entries(grouped).map(([category, perms]) => ({
        category,
        permissions: perms
      }));
    }),
});
