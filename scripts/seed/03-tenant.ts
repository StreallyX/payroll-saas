// /seed/03-tenant.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedTenant() {
  console.log("👉 Seeding base tenant...")

  // The demo tenant name
  const TENANT_NAME = "Demo Company"

  // Check if exists
  let tenant = await prisma.tenant.findFirst({
    where: { name: TENANT_NAME },
  })

  // Create if missing
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: TENANT_NAME,
        primaryColor: "#3b82f6",
        accentColor: "#10b981",
        backgroundColor: "#f8fafc",
        sidebarBgColor: "#ffffff",
        sidebarTextColor: "#111827",
        headerBgColor: "#ffffff",
        headerTextColor: "#111827",
        isActive: true,
      },
    })

    console.log("✅ Tenant created:", tenant.id)
  } else {
    console.log("ℹ️ Tenant already exists:", tenant.id)
  }

  return tenant.id
}
