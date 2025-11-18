
/**
 * Seed Leads
 * Creates sample leads for CRM
 */
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedLeads(tenantId: string) {
  console.log("👉 Seeding leads...");

  const LEADS = [
    {
      name: "Acme Corporation",
      contact: "John Smith",
      email: "john.smith@acmecorp.com",
      phone: "+1-555-5001",
      status: "new",
      source: "website",
      value: new Prisma.Decimal("50000.00"),
      notes: "Interested in enterprise payroll solution for 200+ employees",
    },
    {
      name: "Tech Innovations LLC",
      contact: "Sarah Miller",
      email: "sarah@techinnovations.com",
      phone: "+1-555-5002",
      status: "contacted",
      source: "referral",
      value: new Prisma.Decimal("35000.00"),
      lastContact: new Date("2024-11-10"),
      notes: "Looking for contractor management platform. Follow up scheduled for next week.",
    },
    {
      name: "Global Services Inc",
      contact: "Robert Davis",
      email: "r.davis@globalservices.com",
      phone: "+1-555-5003",
      status: "qualified",
      source: "cold_call",
      value: new Prisma.Decimal("75000.00"),
      lastContact: new Date("2024-11-15"),
      notes: "Qualified lead. Decision maker engaged. Proposal requested.",
    },
    {
      name: "Startup Hub",
      contact: "Emily Johnson",
      email: "emily@startuphub.io",
      phone: "+1-555-5004",
      status: "converted",
      source: "website",
      value: new Prisma.Decimal("25000.00"),
      lastContact: new Date("2024-11-01"),
      notes: "Successfully converted to customer. Contract signed.",
    },
    {
      name: "Retail Solutions Co",
      contact: "Michael Brown",
      email: "mbrown@retailsolutions.com",
      phone: "+1-555-5005",
      status: "lost",
      source: "referral",
      value: new Prisma.Decimal("40000.00"),
      lastContact: new Date("2024-10-20"),
      notes: "Lost to competitor. Budget constraints cited as primary reason.",
    },
  ];

  for (const leadData of LEADS) {
    await prisma.lead.create({
      data: {
        tenantId,
        ...leadData,
      },
    });
  }

  console.log(`✅ ${LEADS.length} leads created`);
}
