# RBAC Phase 2 Refactoring Plan - PRESERVING PHASE 3 Enhancements

## Current State Analysis (refactor/rbac-phase2-migration branch at commit 0d15c1e)

### ✅ PHASE 3 Enhancements to PRESERVE

#### Tenant Model PHASE 3 Fields:
- **Custom Branding**: `customFont`, `primaryColor`, `accentColor`, etc.
- **Email Domain**: `customEmailDomain`, `emailDomainVerified`
- **Subscription Management**: `subscriptionPlan`, `subscriptionStatus`, `subscriptionStartDate`, `subscriptionEndDate`
- **Usage & Limits**: `currentStorageUsed`, `usageMetrics`
- **Localization**: `timezone`, `defaultLanguage`, `defaultCurrency`, `dateFormat`, `timeFormat`
- **Domain Management**: `subdomain`, `customDomain`, `customDomainVerified`, `sslCertificateStatus`, `sslCertificateExpiry`
- **White-label Config**: `loginPageConfig`, `navigationConfig`, `termsOfService`, `termsVersion`, `privacyPolicy`, `privacyPolicyVersion`
- **Onboarding**: `onboardingCompleted`, `onboardingStep`, `onboardingData`

#### PHASE 3 Relations in Tenant:
- `featureFlags` → TenantFeatureFlag[]
- `quotas` → TenantQuota?
- `emailTemplates` → EmailTemplate[]
- `pdfTemplates` → PDFTemplate[]
- `securitySettings` → TenantSecuritySettings?
- `dataExports` → DataExport[]

#### PHASE 3 Models to PRESERVE:
- **TenantFeatureFlag**: Feature flags system
- **TenantQuota**: Quotas and limits per tenant
- **EmailTemplate**: Custom email templates
- **PDFTemplate**: Custom PDF templates
- **TenantSecuritySettings**: Security policies
- **DataExport**: Data export requests
- **TenantImpersonation**: Impersonation tracking
- **SubscriptionInvoice**: Subscription billing

#### PHASE 2 Features to PRESERVE:
- Payment, PaymentMethod, Expense, Timesheet, TimesheetEntry
- ApprovalWorkflow, ApprovalStep
- Document, Comment, Tag, TagAssignment
- CustomField, CustomFieldValue
- UserActivity, ApiKey
- Remittance, Referral

### 🔄 Models to REFACTOR (Remove Rigid Roles):

1. **Company** → Organization (type: "client")
2. **Agency** → Organization (type: "agency")
3. **PayrollPartner** → Organization (type: "payroll_partner")
4. **Contractor** → Merge into User with UserProfile

### 🎯 New RBAC Structure:

#### New Models to ADD:
1. **Organization**: Unified model for all organizations
   - Fields: id, tenantId, name, type (client/agency/payroll_partner), contact info, address, invoicing details
   - Relations: users (many-to-many), contracts

2. **UserRole** (many-to-many): Users can have multiple roles
   - Fields: userId, roleId, organizationId (optional), assignedAt, assignedBy

3. **UserOrganization** (many-to-many): Users can belong to multiple organizations
   - Fields: userId, organizationId, role, permissions, joinedAt

4. **UserProfile**: Extended user information
   - Fields: userId, dateOfBirth, phone, alternatePhone, address fields, profileData (JSON)

### 📝 Changes Required:

1. **Prisma Schema**:
   - ✅ KEEP all Tenant PHASE 3 fields
   - ✅ KEEP all PHASE 3 relations
   - ✅ KEEP all PHASE 3 models
   - ✅ KEEP all PHASE 2 models
   - ❌ REMOVE: Company, Agency, PayrollPartner, Contractor models
   - ✅ ADD: Organization, UserRole, UserOrganization, UserProfile
   - 🔄 UPDATE: Contract, Invoice, Payslip relations to use User & Organization

2. **Permissions**:
   - Keep existing permissions
   - Add organization management permissions
   - Add user-organization permissions

3. **Seed Scripts**:
   - Rewrite to use new Organization model
   - Include test data for PHASE 3 features
   - Create diverse roles and organizations

## Implementation Steps

1. ✅ Backup current schema analysis
2. 🔄 Refactor Prisma schema
3. 🔄 Update permissions-v2.ts
4. 🔄 Rewrite seed scripts
5. 🔄 Commit changes

