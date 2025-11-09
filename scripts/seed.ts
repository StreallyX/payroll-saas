
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create tenant
  let tenant = await prisma.tenant.findFirst({
    where: { name: "Demo Company" },
  })
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Demo Company",
        logoUrl: null,
        primaryColor: "#3b82f6",
        accentColor: "#10b981",
      },
    })
  }
  console.log("✅ Tenant created:", tenant.name)

  // Create permissions
  const permissions = [
    { key: "users.create", description: "Create users" },
    { key: "users.view", description: "View users" },
    { key: "users.update", description: "Update users" },
    { key: "users.delete", description: "Delete users" },
    { key: "agencies.create", description: "Create agencies" },
    { key: "agencies.view", description: "View agencies" },
    { key: "agencies.update", description: "Update agencies" },
    { key: "agencies.delete", description: "Delete agencies" },
    { key: "contractors.create", description: "Create contractors" },
    { key: "contractors.view", description: "View contractors" },
    { key: "contractors.update", description: "Update contractors" },
    { key: "contractors.delete", description: "Delete contractors" },
    { key: "payroll_partners.create", description: "Create payroll partners" },
    { key: "payroll_partners.view", description: "View payroll partners" },
    { key: "payroll_partners.update", description: "Update payroll partners" },
    { key: "payroll_partners.delete", description: "Delete payroll partners" },
    { key: "contracts.create", description: "Create contracts" },
    { key: "contracts.view", description: "View contracts" },
    { key: "contracts.update", description: "Update contracts" },
    { key: "contracts.delete", description: "Delete contracts" },
    { key: "invoices.create", description: "Create invoices" },
    { key: "invoices.view", description: "View invoices" },
    { key: "invoices.update", description: "Update invoices" },
    { key: "invoices.delete", description: "Delete invoices" },
    { key: "system.settings", description: "System settings" },
    { key: "tenant.settings", description: "Tenant settings" },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: permission,
    })
  }
  console.log("✅ Permissions created:", permissions.length)

  // Create roles
  const roles = [
    { name: "admin", tenantId: tenant.id },
    { name: "agency", tenantId: tenant.id },
    { name: "payroll_partner", tenantId: tenant.id },
    { name: "contractor", tenantId: tenant.id },
  ]

  const createdRoles = []
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { 
        tenantId_name: { tenantId: role.tenantId, name: role.name } 
      },
      update: {},
      create: role,
    })
    createdRoles.push(createdRole)
  }
  console.log("✅ Roles created:", createdRoles.length)

  // Assign permissions to roles
  const adminRole = createdRoles.find(r => r.name === "admin")
  const agencyRole = createdRoles.find(r => r.name === "agency")
  const payrollRole = createdRoles.find(r => r.name === "payroll_partner")
  const contractorRole = createdRoles.find(r => r.name === "contractor")

  // Get all permissions
  const allPermissions = await prisma.permission.findMany()

  // Admin gets all permissions
  if (adminRole) {
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    }
  }

  // Agency permissions
  if (agencyRole) {
    const agencyPermissions = allPermissions.filter(p => 
      p.key.includes("contracts.") || 
      p.key.includes("invoices.") ||
      p.key.includes("contractors.view") ||
      p.key.includes("users.") ||
      p.key.includes("tenant.settings")
    )
    for (const permission of agencyPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: agencyRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: agencyRole.id,
          permissionId: permission.id,
        },
      })
    }
  }

  // Payroll partner permissions
  if (payrollRole) {
    const payrollPermissions = allPermissions.filter(p => 
      p.key.includes("contracts.view") ||
      p.key.includes("invoices.") ||
      p.key.includes("contractors.view") ||
      p.key.includes("users.") ||
      p.key.includes("tenant.settings")
    )
    for (const permission of payrollPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: payrollRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: payrollRole.id,
          permissionId: permission.id,
        },
      })
    }
  }

  // Contractor permissions (limited)
  if (contractorRole) {
    const contractorPermissions = allPermissions.filter(p => 
      p.key.includes("contracts.view") ||
      p.key.includes("invoices.view")
    )
    for (const permission of contractorPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: contractorRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: contractorRole.id,
          permissionId: permission.id,
        },
      })
    }
  }
  console.log("✅ Role permissions assigned")

  // Create users
  const users = [
    {
      name: "Demo Admin",
      email: "admin@demo.com",
      password: "password123",
      roleId: adminRole?.id || "",
      tenantId: tenant.id,
    },
    {
      name: "Agency Manager",
      email: "agency@demo.com", 
      password: "password123",
      roleId: agencyRole?.id || "",
      tenantId: tenant.id,
    },
    {
      name: "Payroll Partner",
      email: "payroll@demo.com",
      password: "password123", 
      roleId: payrollRole?.id || "",
      tenantId: tenant.id,
    },
    {
      name: "Demo Contractor",
      email: "contractor@demo.com",
      password: "password123",
      roleId: contractorRole?.id || "",
      tenantId: tenant.id,
    },
    // Default test account
    {
      name: "John Doe",
      email: "john@doe.com",
      password: "johndoe123",
      roleId: adminRole?.id || "",
      tenantId: tenant.id,
    },
  ]

  const createdUsers = []
  for (const user of users) {
    const passwordHash = bcrypt.hashSync(user.password, 10)
    const createdUser = await prisma.user.upsert({
      where: { 
        tenantId_email: { tenantId: user.tenantId, email: user.email }
      },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        roleId: user.roleId,
        tenantId: user.tenantId,
      },
    })
    createdUsers.push(createdUser)
  }
  console.log("✅ Users created:", createdUsers.length)

  // Create sample agencies
  const agencies = [
  {
    name: "Acme Corporation",
    contactEmail: "contact@acme.com",
    contactPhone: "+1-555-0101",
    address1: "123 Business St",
    city: "City",
    state: "State",
    postCode: "12345",
    status: "active",
    tenantId: tenant.id,
  },
  {
    name: "Tech Solutions Inc",
    contactEmail: "info@techsolutions.com",
    contactPhone: "+1-555-0102",
    address1: "456 Innovation Ave",
    city: "City",
    state: "State",
    postCode: "12346",
    status: "active",
    tenantId: tenant.id,
  },
  {
    name: "Global Services LLC",
    contactEmail: "hello@globalservices.com",
    contactPhone: "+1-555-0103",
    address1: "789 Enterprise Blvd",
    city: "City",
    state: "State",
    postCode: "12347",
    status: "active",
    tenantId: tenant.id,
  },
]


  const createdAgencies = []
  for (const agency of agencies) {
    const createdAgency = await prisma.agency.create({
      data: agency,
    })
    createdAgencies.push(createdAgency)
  }
  console.log("✅ Agencies created:", createdAgencies.length)

  // Create sample payroll partners
const payrollPartners = [
  {
    name: "PayPro Services",
    contactEmail: "support@paypro.com",
    contactPhone: "+1-555-0201",
    address: "321 Payroll Plaza, City, State 12350", // ✅ ici
    status: "active",
    tenantId: tenant.id,
  },
  {
    name: "QuickPayroll Inc",
    contactEmail: "contact@quickpayroll.com",
    contactPhone: "+1-555-0202",
    address: "654 Finance Street, City, State 12351", // ✅ ici
    status: "active",
    tenantId: tenant.id,
  },
]



  const createdPayrollPartners = []
  for (const partner of payrollPartners) {
    const createdPartner = await prisma.payrollPartner.create({
      data: partner,
    })
    createdPayrollPartners.push(createdPartner)
  }
  console.log("✅ Payroll partners created:", createdPayrollPartners.length)

  // Create contractor profile for contractor user
  const contractorUser = createdUsers.find(u => u.email === "contractor@demo.com")
  if (contractorUser) {
    await prisma.contractor.upsert({
      where: { userId: contractorUser.id },
      update: {},
      create: {
        userId: contractorUser.id,
        tenantId: tenant.id,
        agencyId: createdAgencies[0]?.id,
        status: "active",
      },
    })
  }
  console.log("✅ Contractor profile created")

  // Create sample contracts
  const contracts = [
    {
      agencyId: createdAgencies[0]?.id || "",
      contractorId: (await prisma.contractor.findFirst())?.id || "",
      payrollPartnerId: createdPayrollPartners[0]?.id || "",
      title: "Frontend Development Contract",
      description: "React.js application development",
      rate: 75.00,
      rateType: "hourly",
      status: "active",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      tenantId: tenant.id,
    },
    {
      agencyId: createdAgencies[1]?.id || "",
      contractorId: (await prisma.contractor.findFirst())?.id || "",
      payrollPartnerId: createdPayrollPartners[1]?.id || "",
      title: "API Integration Project",
      description: "Third-party API integrations",
      rate: 5000.00,
      rateType: "fixed",
      status: "draft",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-05-31"),
      tenantId: tenant.id,
    },
  ]

  const createdContracts = []
  for (const contract of contracts) {
    const createdContract = await prisma.contract.create({
      data: contract,
    })
    createdContracts.push(createdContract)
  }
  console.log("✅ Contracts created:", createdContracts.length)

  // Create sample invoices
  const invoices = [
    {
      contractId: createdContracts[0]?.id || "",
      amount: 6000.00,
      status: "paid",
      invoiceRef: "INV-2024-001",
      dueDate: new Date("2024-01-31"),
      paidAt: new Date("2024-01-25"),
      tenantId: tenant.id,
    },
    {
      contractId: createdContracts[0]?.id || "",
      amount: 6750.00,
      status: "sent",
      invoiceRef: "INV-2024-002", 
      dueDate: new Date("2024-02-28"),
      tenantId: tenant.id,
    },
    {
      contractId: createdContracts[1]?.id || "",
      amount: 2500.00,
      status: "overdue",
      invoiceRef: "INV-2024-003",
      dueDate: new Date("2024-01-15"),
      tenantId: tenant.id,
    },
  ]

  const createdInvoices = []
  for (const invoice of invoices) {
    const createdInvoice = await prisma.invoice.create({
      data: invoice,
    })
    createdInvoices.push(createdInvoice)
  }
  console.log("✅ Invoices created:", createdInvoices.length)

  console.log("🎉 Database seeded successfully!")
  console.log("\n📧 Test Login Credentials:")
  console.log("Admin: admin@demo.com / password123")
  console.log("Agency: agency@demo.com / password123") 
  console.log("Payroll: payroll@demo.com / password123")
  console.log("Contractor: contractor@demo.com / password123")
  console.log("Default Admin: john@doe.com / johndoe123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
