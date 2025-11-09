
# 🏢 Payroll SaaS Platform

A complete multi-tenant SaaS platform for payroll and staffing contract management. Built with Next.js 14, TypeScript, and modern web technologies.

## 🌟 Features

### Multi-Tenant Architecture
- **White-label ready** with tenant-specific branding (logos, colors)
- **Complete data isolation** with tenant-scoped database queries
- **Role-based access control** with granular permissions
- **Dynamic menu system** based on user roles and permissions

### User Roles & Dashboards

#### 🔧 Admin Dashboard
- System overview and analytics
- User management (create, edit, deactivate users)
- Agency management
- Contractor management  
- Payroll partner management
- System settings and configuration

#### 🏢 Agency Dashboard
- Agency-specific overview and metrics
- Contract management (create, track, manage contracts)
- Invoice management and payments
- User management within agency
- Settings and role management

#### 💰 Payroll Partner Dashboard
- Payroll operations overview
- Contract processing and management
- Invoice processing and tracking
- Remittance management
- Payslip generation
- User and role management

#### 👤 Contractor Dashboard
- Personal work overview and progress
- Profile and onboarding management
- Time and expense tracking
- Invoice status monitoring
- Payment history and remittances
- Payslip access and downloads
- Referral system

### Technical Features
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **tRPC** for end-to-end type-safe API calls
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication
- **Tailwind CSS** + **shadcn/ui** for modern UI
- **React Hook Form** + **Zod** for form validation
- **Multi-tenant database design** with proper data isolation
- **Permission-based authorization system**
- **Responsive design** for all devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

### Installation

1. **Clone and install dependencies**
   ```bash
   cd /home/ubuntu/payroll_saas_platform/nextjs_space
   yarn install
   ```

2. **Environment Configuration**
   
   Create a `.env` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/payroll_saas?schema=public"
   
   # NextAuth
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # AWS S3 (for file storage)
   AWS_BUCKET_NAME="your-bucket-name"
   AWS_FOLDER_PREFIX="payroll-saas/"
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-west-2"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push database schema
   npx prisma db push
   
   # Seed with demo data
   yarn run seed
   ```

4. **Run the application**
   ```bash
   yarn dev
   ```

   The application will be available at `http://localhost:3000`

## 🧪 Demo Login Credentials

Use these credentials to explore different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | password123 |
| **Agency** | agency@demo.com | password123 |
| **Payroll Partner** | payroll@demo.com | password123 |
| **Contractor** | contractor@demo.com | password123 |

## 📁 Project Structure

```
/
├── app/                          # Next.js 14 App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── admin/              # Admin role pages
│   │   ├── agency/             # Agency role pages  
│   │   ├── payroll/            # Payroll partner pages
│   │   └── contractor/         # Contractor role pages
│   ├── login/                  # Authentication pages
│   ├── register/
│   └── api/                    # API routes
│       ├── auth/               # NextAuth endpoints
│       ├── signup/             # User registration
│       └── trpc/               # tRPC API router
├── components/                  # Reusable React components
│   ├── layout/                 # Layout components
│   ├── providers/              # Context providers
│   └── ui/                     # shadcn/ui components
├── lib/                        # Utility libraries
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Prisma client
│   ├── menuConfig.ts           # Dynamic menu system
│   ├── permissions.ts          # Permission utilities
│   └── trpc.ts                 # tRPC client setup
├── server/                     # Server-side code
│   └── api/                    # tRPC API implementation
│       ├── root.ts             # Main API router
│       └── routers/            # Feature-specific routers
├── storage/                    # File storage abstraction
├── prisma/                     # Database schema and migrations  
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seed script
└── middleware.ts               # Route protection & redirects
```

## 🏗 Architecture Highlights

### Multi-Tenant Design
- Every database query includes `tenantId` filtering
- Tenant-specific branding (colors, logos) loaded dynamically  
- Complete data isolation between tenants
- White-label ready for resellers

### Permission System
- Granular permissions (e.g., `users.create`, `contracts.view`)
- Role-based access with flexible assignment
- Permission checks in both API and UI layers
- New roles can be added without code changes

### Dynamic Navigation
- Menu items generated from central configuration
- Role-based menu filtering
- No hardcoded navigation in components
- Easy to extend with new features

### Type Safety
- End-to-end TypeScript coverage
- tRPC for type-safe API calls
- Prisma for type-safe database operations
- Zod schemas for runtime validation

## 🔧 Development

### Adding New Features
1. **Database**: Update `prisma/schema.prisma` and run migrations
2. **API**: Create new tRPC routers in `server/api/routers/`
3. **UI**: Create pages in appropriate role directories
4. **Permissions**: Add new permissions to seed script
5. **Navigation**: Update `lib/menuConfig.ts` with new menu items

### Database Commands
```bash
# View database in Prisma Studio
npx prisma studio

# Reset and reseed database
npx prisma db push --force-reset
yarn run seed

# Generate new migration
npx prisma migrate dev --name migration_name
```

### Code Quality
- **ESLint** and **Prettier** configured
- **TypeScript strict mode** enabled
- **Consistent naming conventions**
- **Comprehensive error handling**
- **Loading states** and **responsive design**

## 🚢 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on pushes to main branch

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
AWS_BUCKET_NAME="your-production-bucket"
# ... other AWS credentials
```

## 🎯 Roadmap

### Phase 1 - MVP (Current)
- ✅ Multi-tenant architecture
- ✅ Role-based dashboards
- ✅ Basic CRUD operations
- ✅ Authentication system
- ✅ Permission system

### Phase 2 - Enhanced Features
- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] File upload and document management
- [ ] Email notifications and templates
- [ ] Advanced contract workflow
- [ ] Time tracking integration

### Phase 3 - Enterprise Features  
- [ ] API webhooks
- [ ] Third-party integrations
- [ ] Advanced security features
- [ ] Audit logging
- [ ] Multi-language support
- [ ] Advanced tenant customization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## 📞 Support

For support and questions:
- 📧 Email: support@payrollsaas.com
- 📖 Documentation: [docs.payrollsaas.com](https://docs.payrollsaas.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

Built with ❤️ for the future of payroll management.
