
/**
 * Seed Permissions
 * Populates all system permissions from permissions-v2.ts
 */
import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSIONS, getPermissionCategory, getPermissionDisplayName, getPermissionDescription } from "../../server/rbac/permissions-v2";

export const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log("👉 Seeding permissions...");

  let created = 0;
  let updated = 0;

  for (const key of ALL_PERMISSIONS) {
    const category = getPermissionCategory(key);
    const displayName = getPermissionDisplayName(key);
    const description = getPermissionDescription(key);

    const existing = await prisma.permission.findUnique({
      where: { key },
    });

    if (existing) {
      await prisma.permission.update({
        where: { key },
        data: {
          displayName,
          description,
          category,
        },
      });
      updated++;
    } else {
      await prisma.permission.create({
        data: {
          key,
          displayName,
          description,
          category,
          isSystem: true,
        },
      });
      created++;
    }
  }

  console.log(`✅ Permissions synced: ${created} created, ${updated} updated, ${ALL_PERMISSIONS.length} total`);
}
