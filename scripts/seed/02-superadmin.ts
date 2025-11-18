
/**
 * Seed Super Admin
 * Creates the platform super admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  console.log("👉 Seeding super admin...");

  const hash = await bcrypt.hash("SuperAdmin@2024!", 10);

  await prisma.superAdmin.upsert({
    where: { email: "superadmin@payrollsaas.com" },
    update: {},
    create: {
      email: "superadmin@payrollsaas.com",
      name: "Super Admin",
      passwordHash: hash,
      isActive: true,
    },
  });

  console.log("✅ Super admin created: superadmin@payrollsaas.com");
}
