
import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSION_KEYS_V2 } from "../../server/rbac/permissions-v2";

export async function seedPermissions(prisma: PrismaClient) {
  // Get all permission keys from permissions-v2.ts
  const permissionKeys = ALL_PERMISSION_KEYS_V2;

  console.log(`   Creating ${permissionKeys.length} permissions...`);

  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: key.replace(/\./g, " ").replace(/_/g, " "),
      },
    });
  }
}
