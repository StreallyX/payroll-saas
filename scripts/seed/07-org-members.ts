
/**
 * Seed Organization Members
 * Assigns users to organizations
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedOrganizationMembers(organizations: any[], users: any[]) {
  console.log("👉 Seeding organization members...");

  // Find organizations
  const techCorp = organizations.find((o) => o.name === "TechCorp Solutions Inc.");
  const eliteStaffing = organizations.find((o) => o.name === "Elite Staffing Agency");
  const premierpayroll = organizations.find((o) => o.name === "Premier Payroll Services");

  // Find users
  const financeUser = users.find((u) => u.email === "finance@demo.com");
  const hrUser = users.find((u) => u.email === "hr@demo.com");
  const opsUser = users.find((u) => u.email === "operations@demo.com");

  const MEMBERSHIPS = [
    // TechCorp members
    { organizationId: techCorp?.id, userId: financeUser?.id, role: "finance_admin" },
    { organizationId: techCorp?.id, userId: opsUser?.id, role: "operations_manager" },

    // Elite Staffing members
    { organizationId: eliteStaffing?.id, userId: hrUser?.id, role: "recruitment_manager" },
    
    // Premier Payroll members
    { organizationId: premierpayroll?.id, userId: financeUser?.id, role: "payroll_specialist" },
  ];

  for (const membership of MEMBERSHIPS) {
    if (!membership.organizationId || !membership.userId) continue;

    await prisma.organizationMember.create({
      data: membership,
    });
  }

  console.log(`✅ ${MEMBERSHIPS.length} organization memberships created`);
}
