-- =============================================================
-- PHASE 3: MULTI-TENANCY & WHITE-LABEL MIGRATION
-- =============================================================
-- Generated: 2025-11-15
-- Description: Adds Phase 3 multi-tenancy enhancements and white-label features

-- -------------------------------------------------------
-- ALTER TENANT TABLE - Add Phase 3 Fields
-- -------------------------------------------------------

-- Font Customization
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customFont" TEXT DEFAULT 'Inter';

-- Email Domain
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customEmailDomain" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emailDomainVerified" BOOLEAN NOT NULL DEFAULT false;

-- Subscription Management
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3);

-- Usage & Limits
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "currentStorageUsed" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "usageMetrics" JSONB;

-- Localization
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "defaultLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "timeFormat" TEXT NOT NULL DEFAULT '12h';

-- Domain Management
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "sslCertificateStatus" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "sslCertificateExpiry" TIMESTAMP(3);

-- White-label Configuration
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "loginPageConfig" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "navigationConfig" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "termsOfService" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT DEFAULT '1.0';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "privacyPolicy" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" TEXT DEFAULT '1.0';

-- Onboarding
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboardingData" JSONB;

-- Create unique indexes for subdomain and customDomain
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_subdomain_key" ON "tenants"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON "tenants"("customDomain");

-- -------------------------------------------------------
-- CREATE NEW TABLES
-- -------------------------------------------------------

-- TENANT QUOTAS & LIMITS
CREATE TABLE IF NOT EXISTS "tenant_quotas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxAdmins" INTEGER NOT NULL DEFAULT 5,
    "maxContractors" INTEGER NOT NULL DEFAULT 50,
    "maxContracts" INTEGER NOT NULL DEFAULT 50,
    "maxInvoices" INTEGER NOT NULL DEFAULT 100,
    "maxActiveContracts" INTEGER NOT NULL DEFAULT 25,
    "maxStorage" BIGINT NOT NULL DEFAULT 1073741824,
    "maxFileSize" BIGINT NOT NULL DEFAULT 10485760,
    "maxFilesPerUpload" INTEGER NOT NULL DEFAULT 10,
    "maxAPICallsPerMonth" INTEGER NOT NULL DEFAULT 10000,
    "maxAPICallsPerDay" INTEGER NOT NULL DEFAULT 1000,
    "maxEmailsPerMonth" INTEGER NOT NULL DEFAULT 1000,
    "maxEmailsPerDay" INTEGER NOT NULL DEFAULT 100,
    "maxSMSPerMonth" INTEGER NOT NULL DEFAULT 500,
    "maxCustomFields" INTEGER NOT NULL DEFAULT 20,
    "maxWebhooks" INTEGER NOT NULL DEFAULT 10,
    "maxAPIKeys" INTEGER NOT NULL DEFAULT 5,
    "maxReports" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_quotas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_quotas_tenantId_key" ON "tenant_quotas"("tenantId");

-- FEATURE FLAGS
CREATE TABLE IF NOT EXISTS "tenant_feature_flags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabledAt" TIMESTAMP(3),
    "enabledBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_feature_flags_tenantId_featureKey_key" ON "tenant_feature_flags"("tenantId", "featureKey");
CREATE INDEX IF NOT EXISTS "tenant_feature_flags_tenantId_idx" ON "tenant_feature_flags"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_feature_flags_featureKey_idx" ON "tenant_feature_flags"("featureKey");
CREATE INDEX IF NOT EXISTS "tenant_feature_flags_enabled_idx" ON "tenant_feature_flags"("enabled");

-- EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS "email_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" JSONB,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "styles" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_tenantId_name_key" ON "email_templates"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "email_templates_tenantId_idx" ON "email_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "email_templates_category_idx" ON "email_templates"("category");
CREATE INDEX IF NOT EXISTS "email_templates_isActive_idx" ON "email_templates"("isActive");

-- PDF TEMPLATES
CREATE TABLE IF NOT EXISTS "pdf_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "styles" JSONB,
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'portrait',
    "margins" JSONB,
    "watermarkText" TEXT,
    "watermarkOpacity" DOUBLE PRECISION DEFAULT 0.3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pdf_templates_tenantId_name_key" ON "pdf_templates"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "pdf_templates_tenantId_idx" ON "pdf_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "pdf_templates_type_idx" ON "pdf_templates"("type");
CREATE INDEX IF NOT EXISTS "pdf_templates_isActive_idx" ON "pdf_templates"("isActive");

-- TENANT SECURITY SETTINGS
CREATE TABLE IF NOT EXISTS "tenant_security_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "minPasswordLength" INTEGER NOT NULL DEFAULT 8,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiryDays" INTEGER,
    "passwordHistoryCount" INTEGER NOT NULL DEFAULT 5,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 3,
    "enforceSessionTimeout" BOOLEAN NOT NULL DEFAULT true,
    "ipWhitelist" JSONB,
    "ipBlacklist" JSONB,
    "enableIPRestriction" BOOLEAN NOT NULL DEFAULT false,
    "enforce2FA" BOOLEAN NOT NULL DEFAULT false,
    "enforce2FAForAdmins" BOOLEAN NOT NULL DEFAULT false,
    "allowed2FAMethods" JSONB DEFAULT '["totp", "sms"]',
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "enableAccountLockout" BOOLEAN NOT NULL DEFAULT true,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
    "allowSocialLogin" BOOLEAN NOT NULL DEFAULT true,
    "allowedSocialProviders" JSONB DEFAULT '["google", "microsoft"]',
    "requireAPIKeyForAPI" BOOLEAN NOT NULL DEFAULT true,
    "enableAPIRateLimiting" BOOLEAN NOT NULL DEFAULT true,
    "apiRateLimitPerHour" INTEGER NOT NULL DEFAULT 1000,
    "enableDataEncryption" BOOLEAN NOT NULL DEFAULT true,
    "enableAuditLogging" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 2555,
    "enableAutoDataDeletion" BOOLEAN NOT NULL DEFAULT false,
    "gdprCompliant" BOOLEAN NOT NULL DEFAULT true,
    "hipaaCompliant" BOOLEAN NOT NULL DEFAULT false,
    "soc2Compliant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_security_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_security_settings_tenantId_key" ON "tenant_security_settings"("tenantId");

-- DATA EXPORT REQUESTS
CREATE TABLE IF NOT EXISTS "data_exports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entities" JSONB,
    "dateRangeFrom" TIMESTAMP(3),
    "dateRangeTo" TIMESTAMP(3),
    "filters" JSONB,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "expiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "recordsExported" INTEGER DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_exports_tenantId_idx" ON "data_exports"("tenantId");
CREATE INDEX IF NOT EXISTS "data_exports_status_idx" ON "data_exports"("status");
CREATE INDEX IF NOT EXISTS "data_exports_requestedBy_idx" ON "data_exports"("requestedBy");
CREATE INDEX IF NOT EXISTS "data_exports_createdAt_idx" ON "data_exports"("createdAt");

-- TENANT IMPERSONATION LOGS
CREATE TABLE IF NOT EXISTS "tenant_impersonations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "superAdminName" TEXT NOT NULL,
    "superAdminEmail" TEXT NOT NULL,
    "impersonatedUserId" TEXT,
    "impersonatedUserName" TEXT,
    "impersonatedUserEmail" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "actionsPerformed" JSONB,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenant_impersonations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tenant_impersonations_tenantId_idx" ON "tenant_impersonations"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_impersonations_superAdminId_idx" ON "tenant_impersonations"("superAdminId");
CREATE INDEX IF NOT EXISTS "tenant_impersonations_startedAt_idx" ON "tenant_impersonations"("startedAt");
CREATE INDEX IF NOT EXISTS "tenant_impersonations_isActive_idx" ON "tenant_impersonations"("isActive");

-- SUBSCRIPTION INVOICES
CREATE TABLE IF NOT EXISTS "subscription_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "billingAddress" JSONB,
    "lineItems" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_invoiceNumber_key" ON "subscription_invoices"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "subscription_invoices_tenantId_idx" ON "subscription_invoices"("tenantId");
CREATE INDEX IF NOT EXISTS "subscription_invoices_status_idx" ON "subscription_invoices"("status");
CREATE INDEX IF NOT EXISTS "subscription_invoices_dueDate_idx" ON "subscription_invoices"("dueDate");
CREATE INDEX IF NOT EXISTS "subscription_invoices_paidAt_idx" ON "subscription_invoices"("paidAt");

-- -------------------------------------------------------
-- ADD FOREIGN KEY CONSTRAINTS
-- -------------------------------------------------------

-- Tenant Quotas
ALTER TABLE "tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature Flags
ALTER TABLE "tenant_feature_flags" ADD CONSTRAINT "tenant_feature_flags_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email Templates
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PDF Templates
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Security Settings
ALTER TABLE "tenant_security_settings" ADD CONSTRAINT "tenant_security_settings_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Exports
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -------------------------------------------------------
-- COMMENTS FOR DOCUMENTATION
-- -------------------------------------------------------

COMMENT ON TABLE "tenant_quotas" IS 'Phase 3: Resource quotas and limits per tenant';
COMMENT ON TABLE "tenant_feature_flags" IS 'Phase 3: Feature flag system for tenant-specific features';
COMMENT ON TABLE "email_templates" IS 'Phase 3: Customizable email templates per tenant';
COMMENT ON TABLE "pdf_templates" IS 'Phase 3: Customizable PDF templates for documents';
COMMENT ON TABLE "tenant_security_settings" IS 'Phase 3: Security configuration per tenant';
COMMENT ON TABLE "data_exports" IS 'Phase 3: Data export requests for GDPR compliance';
COMMENT ON TABLE "tenant_impersonations" IS 'Phase 3: Super admin impersonation audit trail';
COMMENT ON TABLE "subscription_invoices" IS 'Phase 3: Billing invoices for tenant subscriptions';

-- -------------------------------------------------------
-- SUCCESS MESSAGE
-- -------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 3 Migration completed successfully!';
    RAISE NOTICE 'Added: Multi-tenancy enhancements & White-label features';
    RAISE NOTICE 'New tables: 8 | Modified tables: 1 (tenants)';
END $$;
