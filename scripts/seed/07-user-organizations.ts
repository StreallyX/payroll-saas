
import { PrismaClient } from "@prisma/client";

export async function seedUserOrganizations(
  prisma: PrismaClient,
  users: any[],
  organizations: any[]
) {
  // Find users and organizations
  const agencyOwner = users.find((u) => u.roleName === "Agency Owner");
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");

  const agencyOrg = organizations.find((o) => o.type === "agency");

  if (agencyOwner && agencyOrg) {
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: agencyOwner.id,
          organizationId: agencyOrg.id,
        },
      },
      update: {},
      create: {
        userId: agencyOwner.id,
        organizationId: agencyOrg.id,
        organizationRole: "owner",
        isActive: true,
      },
    });
  }

  // Assign contractors to agency
  if (contractor1 && agencyOrg) {
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: contractor1.id,
          organizationId: agencyOrg.id,
        },
      },
      update: {},
      create: {
        userId: contractor1.id,
        organizationId: agencyOrg.id,
        organizationRole: "contractor",
        isActive: true,
      },
    });
  }

  if (contractor2 && agencyOrg) {
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: contractor2.id,
          organizationId: agencyOrg.id,
        },
      },
      update: {},
      create: {
        userId: contractor2.id,
        organizationId: agencyOrg.id,
        organizationRole: "contractor",
        isActive: true,
      },
    });
  }
}
