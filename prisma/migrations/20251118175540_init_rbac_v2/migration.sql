/*
  Warnings:

  - You are about to drop the column `allowedIPs` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `keyPrefix` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `rateLimit` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `revokedById` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `approval_steps` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `approval_workflows` table. All the data in the column will be lost.
  - You are about to drop the column `booleanValue` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `dateValue` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `jsonValue` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `numberValue` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `textValue` on the `custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `helpText` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `placeholder` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `validationRules` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `dateRangeFrom` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `dateRangeTo` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `downloadCount` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `entities` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `exportFormat` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `lastDownloadAt` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `recordsExported` on the `data_exports` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `data_exports` table. All the data in the column will be lost.
  - You are about to alter the column `fileSize` on the `data_exports` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the column `uploadedById` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `footerHtml` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `headerHtml` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `htmlBody` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `lastSentAt` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `sentCount` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `styles` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `textBody` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `footerHtml` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `generatedCount` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `headerHtml` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `margins` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `orientation` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `pageSize` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `styles` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `watermarkOpacity` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `watermarkText` on the `pdf_templates` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `hiredAt` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `invitedAt` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `personalMessage` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `referralCode` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `referrerId` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `rewardStatus` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `signedUpAt` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `deductions` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `grossPay` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `netPay` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `remitNumber` on the `remittances` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `tag_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedById` on the `tag_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `tenant_feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `enabledAt` on the `tenant_feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `enabledBy` on the `tenant_feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `tenant_feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `maxAPICallsPerDay` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxAPICallsPerMonth` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxAPIKeys` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxActiveContracts` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxAdmins` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxContractors` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxContracts` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxCustomFields` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxEmailsPerDay` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxFileSize` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxFilesPerUpload` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxInvoices` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxReports` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxSMSPerMonth` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxStorage` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `maxWebhooks` on the `tenant_quotas` table. All the data in the column will be lost.
  - You are about to drop the column `allowSocialLogin` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `allowed2FAMethods` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `allowedSocialProviders` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `apiRateLimitPerHour` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `dataRetentionDays` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableAPIRateLimiting` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableAccountLockout` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableAuditLogging` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableAutoDataDeletion` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableDataEncryption` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enableIPRestriction` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enforce2FA` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enforce2FAForAdmins` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enforceSessionTimeout` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `gdprCompliant` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `hipaaCompliant` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `ipBlacklist` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `ipWhitelist` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHistoryCount` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `requireAPIKeyForAPI` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `requireEmailVerification` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `soc2Compliant` on the `tenant_security_settings` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `entityName` on the `user_activities` table. All the data in the column will be lost.
  - You are about to drop the column `occurredAt` on the `user_activities` table. All the data in the column will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenant_impersonations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,entityType,fieldName]` on the table `custom_fields` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,key]` on the table `email_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,key]` on the table `pdf_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resource,action,scope]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prefix` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `approval_workflows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `custom_field_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `custom_field_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `custom_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fieldLabel` to the `custom_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fieldName` to the `custom_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `data_exports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `email_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `email_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedBy` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `pdf_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `pdf_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerContractorId` to the `referrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `remittances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_createdById_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parentCommentId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_timesheetId_fkey";

-- DropForeignKey
ALTER TABLE "custom_field_values" DROP CONSTRAINT "custom_field_values_createdById_fkey";

-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "remittances" DROP CONSTRAINT "remittances_contractorId_fkey";

-- DropIndex
DROP INDEX "api_keys_isActive_idx";

-- DropIndex
DROP INDEX "api_keys_keyPrefix_idx";

-- DropIndex
DROP INDEX "approval_steps_status_idx";

-- DropIndex
DROP INDEX "contracts_endDate_idx";

-- DropIndex
DROP INDEX "contracts_startDate_idx";

-- DropIndex
DROP INDEX "custom_fields_entityType_idx";

-- DropIndex
DROP INDEX "custom_fields_tenantId_entityType_key_key";

-- DropIndex
DROP INDEX "data_exports_createdAt_idx";

-- DropIndex
DROP INDEX "documents_category_idx";

-- DropIndex
DROP INDEX "documents_uploadedAt_idx";

-- DropIndex
DROP INDEX "email_templates_category_idx";

-- DropIndex
DROP INDEX "email_templates_isActive_idx";

-- DropIndex
DROP INDEX "email_templates_tenantId_name_key";

-- DropIndex
DROP INDEX "expenses_expenseDate_idx";

-- DropIndex
DROP INDEX "expenses_submittedById_idx";

-- DropIndex
DROP INDEX "invoices_dueDate_idx";

-- DropIndex
DROP INDEX "invoices_invoiceNumber_idx";

-- DropIndex
DROP INDEX "invoices_issueDate_idx";

-- DropIndex
DROP INDEX "payment_methods_isDefault_idx";

-- DropIndex
DROP INDEX "payments_createdAt_idx";

-- DropIndex
DROP INDEX "payments_scheduledDate_idx";

-- DropIndex
DROP INDEX "pdf_templates_isActive_idx";

-- DropIndex
DROP INDEX "pdf_templates_tenantId_name_key";

-- DropIndex
DROP INDEX "pdf_templates_type_idx";

-- DropIndex
DROP INDEX "referrals_referralCode_key";

-- DropIndex
DROP INDEX "referrals_referrerId_idx";

-- DropIndex
DROP INDEX "referrals_rewardStatus_idx";

-- DropIndex
DROP INDEX "remittances_contractId_idx";

-- DropIndex
DROP INDEX "remittances_paymentDate_idx";

-- DropIndex
DROP INDEX "remittances_periodStart_periodEnd_idx";

-- DropIndex
DROP INDEX "remittances_remitNumber_key";

-- DropIndex
DROP INDEX "tags_tenantId_slug_key";

-- DropIndex
DROP INDEX "tenant_feature_flags_enabled_idx";

-- DropIndex
DROP INDEX "tenant_feature_flags_featureKey_idx";

-- DropIndex
DROP INDEX "timesheet_entries_date_idx";

-- DropIndex
DROP INDEX "timesheets_contractId_idx";

-- DropIndex
DROP INDEX "timesheets_startDate_endDate_idx";

-- DropIndex
DROP INDEX "user_activities_entityType_entityId_idx";

-- DropIndex
DROP INDEX "user_activities_occurredAt_idx";

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "allowedIPs",
DROP COLUMN "createdById",
DROP COLUMN "description",
DROP COLUMN "keyPrefix",
DROP COLUMN "metadata",
DROP COLUMN "rateLimit",
DROP COLUMN "revokedAt",
DROP COLUMN "revokedById",
DROP COLUMN "scopes",
DROP COLUMN "usageCount",
ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "prefix" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "approval_steps" DROP COLUMN "comments";

-- AlterTable
ALTER TABLE "approval_workflows" DROP COLUMN "createdById",
ADD COLUMN     "createdBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "custom_field_values" DROP COLUMN "booleanValue",
DROP COLUMN "createdById",
DROP COLUMN "dateValue",
DROP COLUMN "jsonValue",
DROP COLUMN "numberValue",
DROP COLUMN "textValue",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "custom_fields" DROP COLUMN "createdById",
DROP COLUMN "helpText",
DROP COLUMN "isActive",
DROP COLUMN "key",
DROP COLUMN "name",
DROP COLUMN "order",
DROP COLUMN "placeholder",
DROP COLUMN "validationRules",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "fieldLabel" TEXT NOT NULL,
ADD COLUMN     "fieldName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "data_exports" DROP COLUMN "dateRangeFrom",
DROP COLUMN "dateRangeTo",
DROP COLUMN "downloadCount",
DROP COLUMN "entities",
DROP COLUMN "errorMessage",
DROP COLUMN "exportFormat",
DROP COLUMN "fileName",
DROP COLUMN "filters",
DROP COLUMN "lastDownloadAt",
DROP COLUMN "recordsExported",
DROP COLUMN "startedAt",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "format" TEXT NOT NULL,
ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "fileSize" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "document_types" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "uploadedById",
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "email_templates" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "displayName",
DROP COLUMN "footerHtml",
DROP COLUMN "headerHtml",
DROP COLUMN "htmlBody",
DROP COLUMN "isDefault",
DROP COLUMN "lastSentAt",
DROP COLUMN "sentCount",
DROP COLUMN "styles",
DROP COLUMN "textBody",
DROP COLUMN "version",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "approvedById",
DROP COLUMN "submittedById",
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "submittedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "createdById",
ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "onboarding_responses" ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable
ALTER TABLE "onboarding_templates" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "createdById",
ADD COLUMN     "createdBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payroll_partners" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "generatedBy" TEXT;

-- AlterTable
ALTER TABLE "pdf_templates" DROP COLUMN "description",
DROP COLUMN "displayName",
DROP COLUMN "footerHtml",
DROP COLUMN "generatedCount",
DROP COLUMN "headerHtml",
DROP COLUMN "isDefault",
DROP COLUMN "lastUsedAt",
DROP COLUMN "margins",
DROP COLUMN "orientation",
DROP COLUMN "pageSize",
DROP COLUMN "styles",
DROP COLUMN "template",
DROP COLUMN "type",
DROP COLUMN "version",
DROP COLUMN "watermarkOpacity",
DROP COLUMN "watermarkText",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "variables" JSONB;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resource" TEXT NOT NULL,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'global',
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "referrals" DROP COLUMN "completedAt",
DROP COLUMN "hiredAt",
DROP COLUMN "invitedAt",
DROP COLUMN "metadata",
DROP COLUMN "notes",
DROP COLUMN "personalMessage",
DROP COLUMN "referralCode",
DROP COLUMN "referrerId",
DROP COLUMN "rejectedAt",
DROP COLUMN "rewardStatus",
DROP COLUMN "signedUpAt",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "referrerContractorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "remittances" DROP COLUMN "createdById",
DROP COLUMN "deductions",
DROP COLUMN "grossPay",
DROP COLUMN "metadata",
DROP COLUMN "netPay",
DROP COLUMN "paymentDate",
DROP COLUMN "paymentId",
DROP COLUMN "paymentMethod",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
DROP COLUMN "remitNumber",
ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "conditions" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "color" TEXT DEFAULT '#3b82f6',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT DEFAULT 'user',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "homePath" SET DEFAULT '/dashboard';

-- AlterTable
ALTER TABLE "tag_assignments" DROP COLUMN "assignedAt",
DROP COLUMN "assignedById",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "category",
DROP COLUMN "createdById",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "slug",
DROP COLUMN "usageCount",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#3b82f6';

-- AlterTable
ALTER TABLE "tenant_feature_flags" DROP COLUMN "enabled",
DROP COLUMN "enabledAt",
DROP COLUMN "enabledBy",
DROP COLUMN "expiresAt",
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tenant_quotas" DROP COLUMN "maxAPICallsPerDay",
DROP COLUMN "maxAPICallsPerMonth",
DROP COLUMN "maxAPIKeys",
DROP COLUMN "maxActiveContracts",
DROP COLUMN "maxAdmins",
DROP COLUMN "maxContractors",
DROP COLUMN "maxContracts",
DROP COLUMN "maxCustomFields",
DROP COLUMN "maxEmailsPerDay",
DROP COLUMN "maxFileSize",
DROP COLUMN "maxFilesPerUpload",
DROP COLUMN "maxInvoices",
DROP COLUMN "maxReports",
DROP COLUMN "maxSMSPerMonth",
DROP COLUMN "maxStorage",
DROP COLUMN "maxWebhooks",
ADD COLUMN     "maxApiCallsPerDay" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "maxContractsPerMonth" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "maxInvoicesPerMonth" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxStorageGB" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "maxEmailsPerMonth" SET DEFAULT 500;

-- AlterTable
ALTER TABLE "tenant_security_settings" DROP COLUMN "allowSocialLogin",
DROP COLUMN "allowed2FAMethods",
DROP COLUMN "allowedSocialProviders",
DROP COLUMN "apiRateLimitPerHour",
DROP COLUMN "dataRetentionDays",
DROP COLUMN "enableAPIRateLimiting",
DROP COLUMN "enableAccountLockout",
DROP COLUMN "enableAuditLogging",
DROP COLUMN "enableAutoDataDeletion",
DROP COLUMN "enableDataEncryption",
DROP COLUMN "enableIPRestriction",
DROP COLUMN "enforce2FA",
DROP COLUMN "enforce2FAForAdmins",
DROP COLUMN "enforceSessionTimeout",
DROP COLUMN "gdprCompliant",
DROP COLUMN "hipaaCompliant",
DROP COLUMN "ipBlacklist",
DROP COLUMN "ipWhitelist",
DROP COLUMN "passwordHistoryCount",
DROP COLUMN "requireAPIKeyForAPI",
DROP COLUMN "requireEmailVerification",
DROP COLUMN "soc2Compliant",
ADD COLUMN     "allowedIPs" TEXT[],
ADD COLUMN     "blockedIPs" TEXT[],
ADD COLUMN     "require2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require2FAForAdmins" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "sessionTimeoutMinutes" SET DEFAULT 480;

-- AlterTable
ALTER TABLE "timesheets" DROP COLUMN "approvedById",
ADD COLUMN     "approvedBy" TEXT;

-- AlterTable
ALTER TABLE "user_activities" DROP COLUMN "entityName",
DROP COLUMN "occurredAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "entityType" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "webhook_subscriptions" ADD COLUMN     "createdBy" TEXT;

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "subscription_invoices";

-- DropTable
DROP TABLE "tenant_impersonations";

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "agencies_tenantId_idx" ON "agencies"("tenantId");

-- CreateIndex
CREATE INDEX "agencies_createdBy_idx" ON "agencies"("createdBy");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "approval_steps_approverId_idx" ON "approval_steps"("approverId");

-- CreateIndex
CREATE INDEX "approval_workflows_createdBy_idx" ON "approval_workflows"("createdBy");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "banks_tenantId_idx" ON "banks"("tenantId");

-- CreateIndex
CREATE INDEX "banks_createdBy_idx" ON "banks"("createdBy");

-- CreateIndex
CREATE INDEX "companies_tenantId_idx" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "companies_createdBy_idx" ON "companies"("createdBy");

-- CreateIndex
CREATE INDEX "contract_documents_uploadedBy_idx" ON "contract_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "contract_status_history_changedBy_idx" ON "contract_status_history"("changedBy");

-- CreateIndex
CREATE INDEX "contractors_tenantId_idx" ON "contractors"("tenantId");

-- CreateIndex
CREATE INDEX "contractors_userId_idx" ON "contractors"("userId");

-- CreateIndex
CREATE INDEX "contracts_createdBy_idx" ON "contracts"("createdBy");

-- CreateIndex
CREATE INDEX "contracts_assignedTo_idx" ON "contracts"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_tenantId_entityType_fieldName_key" ON "custom_fields"("tenantId", "entityType", "fieldName");

-- CreateIndex
CREATE INDEX "document_types_tenantId_idx" ON "document_types"("tenantId");

-- CreateIndex
CREATE INDEX "documents_uploadedBy_idx" ON "documents"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_tenantId_key_key" ON "email_templates"("tenantId", "key");

-- CreateIndex
CREATE INDEX "expenses_submittedBy_idx" ON "expenses"("submittedBy");

-- CreateIndex
CREATE INDEX "expenses_approvedBy_idx" ON "expenses"("approvedBy");

-- CreateIndex
CREATE INDEX "invoices_createdBy_idx" ON "invoices"("createdBy");

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_createdBy_idx" ON "leads"("createdBy");

-- CreateIndex
CREATE INDEX "leads_assignedTo_idx" ON "leads"("assignedTo");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "onboarding_questions_onboardingTemplateId_idx" ON "onboarding_questions"("onboardingTemplateId");

-- CreateIndex
CREATE INDEX "onboarding_responses_reviewedBy_idx" ON "onboarding_responses"("reviewedBy");

-- CreateIndex
CREATE INDEX "onboarding_templates_tenantId_idx" ON "onboarding_templates"("tenantId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "payments_createdBy_idx" ON "payments"("createdBy");

-- CreateIndex
CREATE INDEX "payroll_partners_tenantId_idx" ON "payroll_partners"("tenantId");

-- CreateIndex
CREATE INDEX "payroll_partners_createdBy_idx" ON "payroll_partners"("createdBy");

-- CreateIndex
CREATE INDEX "payslips_tenantId_idx" ON "payslips"("tenantId");

-- CreateIndex
CREATE INDEX "payslips_contractorId_idx" ON "payslips"("contractorId");

-- CreateIndex
CREATE INDEX "payslips_generatedBy_idx" ON "payslips"("generatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "pdf_templates_tenantId_key_key" ON "pdf_templates"("tenantId", "key");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_scope_idx" ON "permissions"("scope");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE INDEX "referrals_referrerContractorId_idx" ON "referrals"("referrerContractorId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tenantId_name_key" ON "tags"("tenantId", "name");

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "tasks"("tenantId");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_idx" ON "tasks"("assignedTo");

-- CreateIndex
CREATE INDEX "tasks_assignedBy_idx" ON "tasks"("assignedBy");

-- CreateIndex
CREATE INDEX "timesheets_approvedBy_idx" ON "timesheets"("approvedBy");

-- CreateIndex
CREATE INDEX "user_activities_action_idx" ON "user_activities"("action");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "user_activities"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_tenantId_idx" ON "webhook_subscriptions"("tenantId");

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerContractorId_fkey" FOREIGN KEY ("referrerContractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
