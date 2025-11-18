
// =============================================================
// SEED: USERS
// =============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  {
    email: "admin@demo.com",
    name: "Admin User",
    role: "tenant_admin",
    password: "Admin123!",
  },
  {
    email: "finance@demo.com",
    name: "Finance Manager",
    role: "finance_manager",
    password: "Finance123!",
  },
  {
    email: "hr@demo.com",
    name: "HR Manager",
    role: "hr_manager",
    password: "HR123!",
  },
  {
    email: "payroll@demo.com",
    name: "Payroll Manager",
    role: "payroll_manager",
    password: "Payroll123!",
  },
  {
    email: "operations@demo.com",
    name: "Operations Manager",
    role: "operations_manager",
    password: "Operations123!",
  },
  {
    email: "accountant@demo.com",
    name: "Senior Accountant",
    role: "accountant",
    password: "Accountant123!",
  },
  {
    email: "recruiter@demo.com",
    name: "Lead Recruiter",
    role: "recruiter",
    password: "Recruiter123!",
  },
  // Contractors
  {
    email: "john.doe@contractor.com",
    name: "John Doe",
    role: "contractor",
    password: "Contractor123!",
    profile: {
      firstName: "John",
      lastName: "Doe",
      jobTitle: "Senior Software Engineer",
      phone: "+1-555-0101",
      city: "San Francisco",
      countryCode: "US",
    },
  },
  {
    email: "jane.smith@contractor.com",
    name: "Jane Smith",
    role: "contractor",
    password: "Contractor123!",
    profile: {
      firstName: "Jane",
      lastName: "Smith",
      jobTitle: "UI/UX Designer",
      phone: "+44-20-1234-5678",
      city: "London",
      countryCode: "GB",
    },
  },
  {
    email: "mike.johnson@contractor.com",
    name: "Mike Johnson",
    role: "contractor",
    password: "Contractor123!",
    profile: {
      firstName: "Mike",
      lastName: "Johnson",
      jobTitle: "DevOps Engineer",
      phone: "+1-555-0102",
      city: "Toronto",
      countryCode: "CA",
    },
  },
  {
    email: "sarah.williams@contractor.com",
    name: "Sarah Williams",
    role: "contractor",
    password: "Contractor123!",
    profile: {
      firstName: "Sarah",
      lastName: "Williams",
      jobTitle: "Product Manager",
      phone: "+61-2-1234-5678",
      city: "Sydney",
      countryCode: "AU",
    },
  },
  {
    email: "david.brown@contractor.com",
    name: "David Brown",
    role: "contractor",
    password: "Contractor123!",
    profile: {
      firstName: "David",
      lastName: "Brown",
      jobTitle: "Data Analyst",
      phone: "+49-30-12345678",
      city: "Berlin",
      countryCode: "DE",
    },
  },
];

export async function seedUsers(tenantId: string) {
  console.log("👤 Seeding users...");

  for (const userData of USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Find role
    const role = await prisma.role.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: userData.role,
        },
      },
    });

    if (!role) {
      console.log(`   ⚠️  Role ${userData.role} not found, skipping ${userData.email}`);
      continue;
    }

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
        name: userData.name,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        emailVerified: true,
      },
    });

    // Assign role to user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
        isPrimary: true,
      },
    });

    // Create profile if provided
    if (userData.profile) {
      const country = await prisma.country.findUnique({
        where: { code: userData.profile.countryCode },
      });

      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          firstName: userData.profile.firstName,
          lastName: userData.profile.lastName,
          jobTitle: userData.profile.jobTitle,
          alternatePhone: userData.profile.phone,
          city: userData.profile.city,
          countryId: country?.id,
        },
      });
    }

    console.log(`   ✓ ${user.email} (${userData.role})`);
  }

  console.log(`✅ Users seeded: ${USERS.length}`);
  console.log(`\n🔑 Default password for all users: [role]123! (e.g., Admin123!, Contractor123!)`);
}

// Run if executed directly
if (require.main === module) {
  seedUsers(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding users:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
