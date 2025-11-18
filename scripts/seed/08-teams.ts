
/**
 * Seed Teams
 * Creates teams and team members
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedTeams(tenantId: string, organizations: any[], users: any[]) {
  console.log("👉 Seeding teams...");

  const techCorp = organizations.find((o) => o.name === "TechCorp Solutions Inc.");
  
  // Find users
  const teamLead = users.find((u) => u.email === "teamlead@demo.com");
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const contractor3 = users.find((u) => u.email === "contractor3@demo.com");

  // Create Engineering Team
  const engineeringTeam = await prisma.team.create({
    data: {
      tenantId,
      organizationId: techCorp?.id,
      name: "Engineering Team",
      description: "Core engineering team responsible for product development",
      isActive: true,
    },
  });

  // Add team members
  if (teamLead) {
    await prisma.teamMember.create({
      data: {
        teamId: engineeringTeam.id,
        userId: teamLead.id,
        role: "lead",
      },
    });
  }

  if (contractor1) {
    await prisma.teamMember.create({
      data: {
        teamId: engineeringTeam.id,
        userId: contractor1.id,
        role: "member",
      },
    });
  }

  if (contractor3) {
    await prisma.teamMember.create({
      data: {
        teamId: engineeringTeam.id,
        userId: contractor3.id,
        role: "member",
      },
    });
  }

  // Create Design Team
  const designTeam = await prisma.team.create({
    data: {
      tenantId,
      organizationId: techCorp?.id,
      name: "Design Team",
      description: "Creative team handling UI/UX design",
      isActive: true,
    },
  });

  if (contractor2) {
    await prisma.teamMember.create({
      data: {
        teamId: designTeam.id,
        userId: contractor2.id,
        role: "member",
      },
    });
  }

  console.log("✅ Teams created with members");
  return { engineeringTeam, designTeam };
}
