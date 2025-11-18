
/**
 * Seed Tenant
 * Creates demo tenant
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedTenant() {
  console.log("👉 Seeding demo tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant-001" },
    update: {},
    create: {
      id: "demo-tenant-001",
      name: "Demo Payroll Company",
      logoUrl: "https://i.ytimg.com/vi/a3zxTVgRB_w/maxresdefault.jpg",
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
      isActive: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);
  return tenant.id;
}
