
// =============================================================
// SEED: SUPER ADMIN
// =============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  console.log("👑 Seeding super admin...");

  const passwordHash = await bcrypt.hash("SuperAdmin123!", 10);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "superadmin@payroll-saas.com" },
    update: {},
    create: {
      email: "superadmin@payroll-saas.com",
      name: "Super Administrator",
      passwordHash,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log(`   Password: SuperAdmin123!`);
}

// Run if executed directly
if (require.main === module) {
  seedSuperAdmin()
    .catch((e) => {
      console.error("❌ Error seeding super admin:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
