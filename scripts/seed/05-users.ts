
/**
 * Seed Users
 * Creates demo users with various roles
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

export async function seedUsers(tenantId: string) {
  console.log("👉 Seeding demo users...");

  // Get roles
  const roles = await prisma.role.findMany({
    where: { tenantId },
  });

  function getRoleId(name: string) {
    const role = roles.find((r) => r.name === name);
    if (!role) throw new Error(`Role not found: ${name}`);
    return role.id;
  }

  // Get country IDs
  const usCountry = await prisma.country.findUnique({ where: { code: "US" } });
  const ukCountry = await prisma.country.findUnique({ where: { code: "GB" } });

  const hash = await bcrypt.hash("Password@123", 10);

  // Demo users
  const DEMO_USERS = [
    {
      email: "admin@demo.com",
      roleName: "tenant_admin",
      profile: {
        firstName: "Sarah",
        lastName: "Johnson",
        fullName: "Sarah Johnson",
        phone: "+1-555-0101",
        jobTitle: "Platform Administrator",
        department: "Administration",
        countryId: usCountry?.id,
        city: "New York",
        state: "NY",
      },
    },
    {
      email: "finance@demo.com",
      roleName: "finance_manager",
      profile: {
        firstName: "Michael",
        lastName: "Chen",
        fullName: "Michael Chen",
        phone: "+1-555-0102",
        jobTitle: "Finance Manager",
        department: "Finance",
        countryId: usCountry?.id,
        city: "San Francisco",
        state: "CA",
      },
    },
    {
      email: "hr@demo.com",
      roleName: "hr_manager",
      profile: {
        firstName: "Emma",
        lastName: "Williams",
        fullName: "Emma Williams",
        phone: "+1-555-0103",
        jobTitle: "HR Manager",
        department: "Human Resources",
        countryId: ukCountry?.id,
        city: "London",
        state: "England",
      },
    },
    {
      email: "operations@demo.com",
      roleName: "operations_manager",
      profile: {
        firstName: "James",
        lastName: "Brown",
        fullName: "James Brown",
        phone: "+1-555-0104",
        jobTitle: "Operations Manager",
        department: "Operations",
        countryId: usCountry?.id,
        city: "Austin",
        state: "TX",
      },
    },
    {
      email: "accountant@demo.com",
      roleName: "accountant",
      profile: {
        firstName: "Lisa",
        lastName: "Martinez",
        fullName: "Lisa Martinez",
        phone: "+1-555-0105",
        jobTitle: "Senior Accountant",
        department: "Finance",
        countryId: usCountry?.id,
        city: "Miami",
        state: "FL",
      },
    },
    {
      email: "teamlead@demo.com",
      roleName: "team_lead",
      profile: {
        firstName: "David",
        lastName: "Wilson",
        fullName: "David Wilson",
        phone: "+1-555-0106",
        jobTitle: "Team Lead",
        department: "Engineering",
        countryId: usCountry?.id,
        city: "Seattle",
        state: "WA",
      },
    },
    {
      email: "contractor1@demo.com",
      roleName: "contractor",
      profile: {
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        phone: "+1-555-0201",
        jobTitle: "Software Engineer",
        department: "Engineering",
        countryId: usCountry?.id,
        city: "Boston",
        state: "MA",
        bio: "Experienced software engineer specializing in web development",
      },
    },
    {
      email: "contractor2@demo.com",
      roleName: "contractor",
      profile: {
        firstName: "Jane",
        lastName: "Smith",
        fullName: "Jane Smith",
        phone: "+44-20-1234-5678",
        jobTitle: "UI/UX Designer",
        department: "Design",
        countryId: ukCountry?.id,
        city: "Manchester",
        state: "England",
        bio: "Creative designer with 5+ years of experience",
      },
    },
    {
      email: "contractor3@demo.com",
      roleName: "contractor",
      profile: {
        firstName: "Carlos",
        lastName: "Rodriguez",
        fullName: "Carlos Rodriguez",
        phone: "+1-555-0203",
        jobTitle: "DevOps Engineer",
        department: "Engineering",
        countryId: usCountry?.id,
        city: "Denver",
        state: "CO",
        bio: "DevOps specialist with expertise in cloud infrastructure",
      },
    },
    {
      email: "viewer@demo.com",
      roleName: "viewer",
      profile: {
        firstName: "Alex",
        lastName: "Taylor",
        fullName: "Alex Taylor",
        phone: "+1-555-0107",
        jobTitle: "Business Analyst",
        department: "Analytics",
        countryId: usCountry?.id,
        city: "Chicago",
        state: "IL",
      },
    },
  ];

  const createdUsers: any[] = [];

  for (const userData of DEMO_USERS) {
    // Create user
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: userData.email,
        },
      },
      update: {},
      create: {
        tenantId,
        email: userData.email,
        passwordHash: hash,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Create user profile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ...userData.profile,
      },
    });

    // Assign role
    const roleId = getRoleId(userData.roleName);
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
      },
    });

    createdUsers.push({ ...user, roleName: userData.roleName });
    console.log(`   ✓ Created user: ${userData.profile.fullName} (${userData.email}) - ${userData.roleName}`);
  }

  console.log(`✅ ${DEMO_USERS.length} users created`);
  return createdUsers;
}
