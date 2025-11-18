
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient, tenantId: string) {
  const password = await bcrypt.hash("password123", 10);

  const users = [
    {
      email: "admin@demo.com",
      name: "Admin User",
      role: "Tenant Admin",
      isActive: true,
    },
    {
      email: "hr@demo.com",
      name: "HR Manager",
      role: "HR Manager",
      isActive: true,
    },
    {
      email: "finance@demo.com",
      name: "Finance Manager",
      role: "Finance Manager",
      isActive: true,
    },
    {
      email: "contractor1@demo.com",
      name: "John Contractor",
      role: "Contractor",
      isActive: true,
    },
    {
      email: "contractor2@demo.com",
      name: "Jane Contractor",
      role: "Contractor",
      isActive: true,
    },
    {
      email: "agency@demo.com",
      name: "Agency Owner",
      role: "Agency Owner",
      isActive: true,
    },
  ];

  const createdUsers = [];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: userData.email } },
      update: {},
      create: {
        tenantId,
        email: userData.email,
        name: userData.name,
        passwordHash: password,
        mustChangePassword: false,
        isActive: userData.isActive,
        emailVerified: true,
        profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`,
      },
    });

    createdUsers.push({ ...user, roleName: userData.role });

    // Create user profile for contractors
    if (userData.role === "Contractor") {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          dateOfBirth: new Date("1990-01-01"),
          alternatePhone: "+1234567890",
          address1: "123 Main St",
          city: "New York",
          state: "NY",
          postCode: "10001",
        },
      });
    }
  }

  return createdUsers;
}
