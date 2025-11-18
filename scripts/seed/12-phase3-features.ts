
import { PrismaClient } from "@prisma/client";

export async function seedPhase3Features(
  prisma: PrismaClient,
  tenantId: string,
  users: any[]
) {
  // 1. Tenant Quotas
  await prisma.tenantQuota.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      maxUsers: 100,
      maxAdmins: 10,
      maxContractors: 200,
      maxContracts: 500,
      maxInvoices: 1000,
      maxActiveContracts: 100,
      maxStorage: BigInt(10 * 1024 * 1024 * 1024), // 10GB
      maxFileSize: BigInt(50 * 1024 * 1024), // 50MB
      maxFilesPerUpload: 20,
      maxAPICallsPerMonth: 50000,
      maxAPICallsPerDay: 5000,
      maxEmailsPerMonth: 5000,
      maxEmailsPerDay: 500,
      maxSMSPerMonth: 1000,
      maxCustomFields: 50,
      maxWebhooks: 20,
      maxAPIKeys: 10,
      maxReports: 100,
    },
  });

  // 2. Feature Flags
  const features = [
    { key: "advanced_analytics", enabled: true },
    { key: "custom_domain", enabled: true },
    { key: "api_access", enabled: true },
    { key: "white_label", enabled: true },
    { key: "sso", enabled: false },
    { key: "multi_currency", enabled: true },
    { key: "custom_reports", enabled: true },
    { key: "webhooks", enabled: true },
  ];

  for (const feature of features) {
    await prisma.tenantFeatureFlag.upsert({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey: feature.key,
        },
      },
      update: {},
      create: {
        tenantId,
        featureKey: feature.key,
        enabled: feature.enabled,
        enabledAt: feature.enabled ? new Date() : null,
      },
    });
  }

  // 3. Email Templates
  const emailTemplates = [
    {
      name: "welcome_email",
      displayName: "Welcome Email",
      category: "authentication",
      subject: "Welcome to {{tenant_name}}!",
      htmlBody: "<h1>Welcome {{user_name}}!</h1><p>We're excited to have you on board.</p>",
      textBody: "Welcome {{user_name}}! We're excited to have you on board.",
      variables: { user_name: "string", tenant_name: "string" },
      isDefault: true,
    },
    {
      name: "contract_signed",
      displayName: "Contract Signed Notification",
      category: "contracts",
      subject: "Contract Signed - {{contract_title}}",
      htmlBody: "<h1>Contract Signed</h1><p>Your contract {{contract_title}} has been signed.</p>",
      textBody: "Contract {{contract_title}} has been signed.",
      variables: { contract_title: "string", contractor_name: "string" },
      isDefault: true,
    },
    {
      name: "invoice_email",
      displayName: "Invoice Email",
      category: "invoicing",
      subject: "Invoice {{invoice_number}} - Due {{due_date}}",
      htmlBody: "<h1>Invoice {{invoice_number}}</h1><p>Amount: {{amount}}</p><p>Due: {{due_date}}</p>",
      textBody: "Invoice {{invoice_number}} - Amount: {{amount}} - Due: {{due_date}}",
      variables: { invoice_number: "string", amount: "number", due_date: "date" },
      isDefault: true,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: template.name,
        },
      },
      update: {},
      create: {
        tenantId,
        ...template,
      },
    });
  }

  // 4. PDF Templates
  const pdfTemplates = [
    {
      name: "contract_template",
      displayName: "Contract Template",
      type: "contract",
      template: "<html><body><h1>CONTRACT</h1><p>Between {{client_name}} and {{contractor_name}}</p></body></html>",
      pageSize: "A4",
      orientation: "portrait",
      isDefault: true,
    },
    {
      name: "invoice_template",
      displayName: "Invoice Template",
      type: "invoice",
      template: "<html><body><h1>INVOICE</h1><p>Invoice #{{invoice_number}}</p><p>Amount: {{amount}}</p></body></html>",
      pageSize: "A4",
      orientation: "portrait",
      isDefault: true,
    },
    {
      name: "payslip_template",
      displayName: "Payslip Template",
      type: "payslip",
      template: "<html><body><h1>PAYSLIP</h1><p>For {{contractor_name}}</p><p>Period: {{period}}</p></body></html>",
      pageSize: "A4",
      orientation: "portrait",
      isDefault: true,
    },
  ];

  for (const template of pdfTemplates) {
    await prisma.pDFTemplate.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: template.name,
        },
      },
      update: {},
      create: {
        tenantId,
        ...template,
      },
    });
  }

  // 5. Security Settings
  await prisma.tenantSecuritySettings.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiryDays: 90,
      passwordHistoryCount: 5,
      sessionTimeoutMinutes: 60,
      maxConcurrentSessions: 3,
      enforceSessionTimeout: true,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      enableAccountLockout: true,
      requireEmailVerification: true,
      allowSocialLogin: true,
      enforce2FA: false,
      enforce2FAForAdmins: true,
      requireAPIKeyForAPI: true,
      enableAPIRateLimiting: true,
      apiRateLimitPerHour: 1000,
      enableDataEncryption: true,
      enableAuditLogging: true,
      dataRetentionDays: 2555, // 7 years
      enableAutoDataDeletion: false,
      gdprCompliant: true,
      hipaaCompliant: false,
      soc2Compliant: false,
    },
  });

  // 6. Sample Data Export Request
  const adminUser = users.find((u) => u.email === "admin@demo.com");
  if (adminUser) {
    await prisma.dataExport.create({
      data: {
        tenantId,
        requestedBy: adminUser.id,
        exportType: "full_export",
        exportFormat: "zip",
        status: "completed",
        entities: ["users", "contracts", "invoices", "timesheets"],
        dateRangeFrom: new Date("2024-01-01"),
        dateRangeTo: new Date("2024-12-31"),
        fileUrl: "https://example.com/exports/demo-export.zip",
        fileName: "demo-export.zip",
        fileSize: BigInt(5 * 1024 * 1024), // 5MB
        recordsExported: 150,
        startedAt: new Date(),
        completedAt: new Date(),
        downloadCount: 1,
        lastDownloadAt: new Date(),
      },
    });
  }

  console.log("   ✅ Created Tenant Quotas");
  console.log("   ✅ Created Feature Flags");
  console.log("   ✅ Created Email Templates");
  console.log("   ✅ Created PDF Templates");
  console.log("   ✅ Created Security Settings");
  console.log("   ✅ Created Sample Data Export");
}
