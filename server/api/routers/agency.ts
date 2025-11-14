import { z } from "zod"
import { hash } from "bcryptjs"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { sanitizeData, generateRandomPassword } from "@/lib/utils"

export const agencyRouter = createTRPCRouter({
  // 🧭 Get all agencies
  getAll: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.agency.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        country: true,
        contractors: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        contracts: true,
        _count: {
          select: {
            contractors: true,
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  // 🔍 Get agency by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("🔍 [agency.getById] ID reçu:", input.id)

      const agency = await ctx.prisma.agency.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contractors: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          contracts: {
            include: {
              contractor: {
                include: { user: { select: { name: true, email: true } } },
              },
              payrollPartner: { select: { name: true } },
            },
          },
        },
      })

      console.log("✅ [agency.getById] Résultat:", agency?.name || "Aucun trouvé")
      return agency
    }),

  // 🏗️ Create agency (with user account)
  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("🚀 [agency.create] Start")
      console.log("📦 Input received:", input)

      // 1️⃣ Find the role "agency"
      const agencyRole = await ctx.prisma.role.findFirst({
        where: { name: "agency", tenantId: ctx.tenantId },
      })
      if (!agencyRole) throw new Error("Role 'agency' not found, run seed first.")

      // 2️⃣ Generate password
      const password = generateRandomPassword(10)
      const passwordHash = await hash(password, 10)

      // 3️⃣ Create the user (or reuse if exists)
      let user = await ctx.prisma.user.findFirst({
        where: { email: input.contactEmail, tenantId: ctx.tenantId },
      })

      if (user) {
        console.log("⚠️ User already exists:", user.email)
      } else {
        console.log("👤 Creating new user...")
        user = await ctx.prisma.user.create({
          data: {
            tenantId: ctx.tenantId,
            name: input.name,
            email: input.contactEmail,
            passwordHash,
            roleId: agencyRole.id,
          },
        })
        console.log("✅ User created:", user.id)
      }

      // 4️⃣ Create the agency and explicitly set userId
      console.log("🏗️ Creating agency linked to user:", user.id)
      const agency = await ctx.prisma.agency.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone || null,
          city: input.city || null,
          countryId: input.countryId || null,
          userId: user.id, // 👈 LIAISON FINALE
        },
      })

      console.log("✅ Agency created:", agency.id, "| Linked userId:", agency.userId)

      // 5️⃣ Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "admin",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
        description: `Created agency ${agency.name} linked to user ${user.email}`,
        tenantId: ctx.tenantId,
      })

      return { agency, password }
    }),

  // ✏️ Update agency
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        contactPhone: z.string().optional(),
        alternateContactPhone: z.string().optional(),
        contactEmail: z.union([z.string().email(), z.literal(""), z.undefined()]).optional(),
        primaryContactName: z.string().optional(),
        primaryContactJobTitle: z.string().optional(),
        fax: z.string().optional(),
        notes: z.string().optional(),
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
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("✏️ [agency.update] ID:", input.id)
      const { id, ...updateData } = input
      const cleanData = sanitizeData(updateData)

      const agency = await ctx.prisma.agency.update({
        where: { id, tenantId: ctx.tenantId },
        data: cleanData,
      })

      console.log("✅ [agency.update] Agence mise à jour:", agency.name)

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
        tenantId: ctx.tenantId,
      })

      return agency
    }),

  // 🗑️ Delete agency
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("🗑️ [agency.delete] Suppression de:", input.id)
      const agency = await ctx.prisma.agency.findUnique({
        where: { id: input.id },
      })

      await ctx.prisma.agency.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      console.log("✅ [agency.delete] Supprimée:", agency?.name)

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.AGENCY,
        entityId: input.id,
        entityName: agency?.name || "Unknown",
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // 📊 Get stats
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const total = await ctx.prisma.agency.count({
      where: { tenantId: ctx.tenantId },
    })

    const active = await ctx.prisma.agency.count({
      where: { tenantId: ctx.tenantId, status: "active" },
    })

    const inactive = await ctx.prisma.agency.count({
      where: { tenantId: ctx.tenantId, status: "inactive" },
    })

    console.log("📊 [agency.getStats] Totaux:", { total, active, inactive })

    return { total, active, inactive }
  }),
})
