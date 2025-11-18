
// =============================================================
// SEED: PERMISSIONS
// =============================================================
import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from "../../server/rbac/permissions-v2";

const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log("🔐 Seeding permissions...");

  let created = 0;
  let updated = 0;

  for (const permission of ALL_PERMISSIONS) {
    // Extract category from permission key (e.g., "users.view" -> "users")
    const category = permission.split(".")[0];

    const result = await prisma.permission.upsert({
      where: { key: permission },
      update: {
        category,
        description: generatePermissionDescription(permission),
      },
      create: {
        key: permission,
        category,
        description: generatePermissionDescription(permission),
        isActive: true,
      },
    });

    if (result) {
      // Check if it was created or updated
      const existing = await prisma.permission.findUnique({
        where: { key: permission },
      });
      if (existing) {
        updated++;
      } else {
        created++;
      }
    }
  }

  console.log(`✅ Permissions seeded: ${ALL_PERMISSIONS.length} total (${created} created, ${updated} updated)`);
}

function generatePermissionDescription(permission: string): string {
  // Convert "users.profile.view" to "Users Profile View"
  const parts = permission.split(".");
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, " "))
    .join(" ");
}

// Run if executed directly
if (require.main === module) {
  seedPermissions()
    .catch((e) => {
      console.error("❌ Error seeding permissions:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
