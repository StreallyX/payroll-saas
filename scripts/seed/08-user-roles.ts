
import { PrismaClient } from "@prisma/client";

export async function seedUserRoles(
  prisma: PrismaClient,
  tenantId: string,
  users: any[]
) {
  for (const user of users) {
    const role = await prisma.role.findFirst({
      where: {
        tenantId,
        name: user.roleName,
      },
    });

    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId_organizationId: {
            userId: user.id,
            roleId: role.id,
            organizationId: null,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
  }
}
