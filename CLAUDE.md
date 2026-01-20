# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
yarn dev              # Start Next.js development server (http://localhost:3000)
yarn build            # Production build
yarn start            # Start production server
yarn lint             # Run ESLint

# Database
npx prisma generate   # Generate Prisma client (runs automatically on yarn install)
npx prisma db push    # Push schema changes to database
npx prisma studio     # Open Prisma Studio GUI
yarn seed             # Seed database with demo data
npx prisma db push --force-reset && yarn seed  # Reset and reseed database

# Migrations
npx prisma migrate dev --name <migration_name>  # Create new migration
```

## Architecture Overview

This is a **multi-tenant payroll SaaS platform** built with Next.js 14 App Router, tRPC, Prisma, and PostgreSQL.

### Core Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix primitives)
- **API**: tRPC v11 for type-safe RPC endpoints
- **Database**: PostgreSQL with Prisma ORM v6.7
- **Auth**: NextAuth.js 4 with JWT sessions and Credentials provider
- **State**: Zustand, Jotai, React Query

### Multi-Tenancy
Every database query must include `tenantId` filtering. The tenant ID comes from the JWT session:
```typescript
const tenantId = ctx.session.user.tenantId
await prisma.invoice.findMany({ where: { tenantId } })
```

### Permission System (RBAC)
Three-tier permission scope system in `server/rbac/permissions.ts`:
- **GLOBAL** - Full access to all tenant resources
- **OWN** - Access only to resources where `ownerId === userId` or `createdBy === userId`
- **TENANT** - Tenant-level operations

Permission format: `resource.action.scope` (e.g., `contract.read.global`, `invoice.approve.own`)

tRPC procedures use permission middleware:
```typescript
tenantProcedure
  .use(hasPermission("contract.read.global"))
  .query(({ ctx }) => { ... })
```

### Key Directories

```
app/(dashboard)/          # Role-based dashboard routes (admin/, agency/, payroll/, contractor/)
server/api/routers/       # tRPC routers (40+ modular routers)
server/rbac/              # Permission system and RBAC helpers
lib/                      # Core utilities (auth.ts, db.ts, permissions.ts, s3.ts)
prisma/schema.prisma      # Database schema (2600+ lines)
components/ui/            # shadcn/ui components
```

### tRPC Router Structure
Entry point: `server/api/root.ts`

Routers are organized by domain:
- **Core**: userRouter, authRouter, roleRouter, permissionRouter
- **Business**: contractRouter, invoiceRouter, companyRouter, taskRouter
- **Financial**: paymentRouter, expenseRouter, timesheetRouter, remittanceRouter, payslipRouter
- **Admin**: emailRouter, documentRouter, approvalWorkflowRouter, auditLogRouter

### Database Patterns
- **Soft deletes**: Use `isActive` boolean, not hard deletion
- **Ownership**: Track `createdBy`, `ownerId` for permission checks
- **Polymorphic entities**: Many tables use `entityType`/`entityId` for flexibility
- **Contract participants**: Multi-party relationships via `ContractParticipant` table

### Adding New Features
1. Update `prisma/schema.prisma` and run migrations
2. Create tRPC router in `server/api/routers/`
3. Add router to `server/api/root.ts`
4. Create UI pages in appropriate `app/(dashboard)/<role>/` directory
5. Add permissions to seed script if needed
6. Update `lib/menuConfig.ts` for navigation

### Path Alias
Use `@/*` to import from project root (configured in tsconfig.json):
```typescript
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing key
- `NEXTAUTH_URL` - Auth callback URL (http://localhost:3000 for dev)
- `AWS_*` - S3 bucket credentials for file storage

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Agency | agency@demo.com | password123 |
| Payroll | payroll@demo.com | password123 |
| Contractor | contractor@demo.com | password123 |
