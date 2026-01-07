# Scripts Directory

This directory contains utility scripts for managing the payroll SaaS application.

## Available Scripts

### Database Seeding

#### `seed.ts`
Seeds the database with initial data including:
- Default tenant
- Base data (currencies and countries)
- RBAC roles and permissions
- Test users (Super Admin, Admin, Payroll, Contractor, Agency)
- Tenant company with bank account
- 4 contracts of each type (GROSS, PAYROLL, PAYROLL_WE_PAY, SPLIT)

**Usage:**
```bash
npx ts-node scripts/seed.ts
```

### Currency Management

#### `insert-currencies.ts`
Inserts common world currencies into the database.

**Usage:**
```bash
npx ts-node scripts/insert-currencies.ts
```

### Feature Request Management

#### `export-requests.ts`
Exports all feature requests and their attachments to a JSON file.

**Usage:**
```bash
# Export to default file (feature-requests-export-{timestamp}.json)
npx ts-node scripts/export-requests.ts

# Export to custom file
npx ts-node scripts/export-requests.ts my-backup.json
```

**Output includes:**
- Export date
- Total request count
- All feature requests with attachments
- User information (email, name)
- Approval/rejection details

#### `import-requests.ts`
Imports feature requests from a JSON file created by `export-requests.ts`.

**Usage:**
```bash
npx ts-node scripts/import-requests.ts <input-file>
```

**Example:**
```bash
npx ts-node scripts/import-requests.ts feature-requests-backup.json
```

**Notes:**
- Validates that users and tenants exist before importing
- Creates new records (does not update existing ones)
- Provides detailed error reporting for failed imports

### Test Page Tracking Management

#### `export-test-pages.ts`
Exports all page test status records to a JSON file.

**Usage:**
```bash
# Export to default file (test-pages-export-{timestamp}.json)
npx ts-node scripts/export-test-pages.ts

# Export to custom file
npx ts-node scripts/export-test-pages.ts test-pages-backup.json
```

**Output includes:**
- Export date
- Total page count
- All page test statuses organized by role
- Validation statistics

#### `import-test-pages.ts`
Imports page test status records from a JSON file created by `export-test-pages.ts`.

**Usage:**
```bash
npx ts-node scripts/import-test-pages.ts <input-file>
```

**Example:**
```bash
npx ts-node scripts/import-test-pages.ts test-pages-backup.json
```

**Notes:**
- Uses upsert operation (updates existing records or creates new ones)
- Validates tenant existence before importing
- Provides detailed error reporting for failed imports

## Best Practices

1. **Backup Before Import**: Always create a backup before running import scripts
2. **Test Environment First**: Test scripts in a development environment before production
3. **Check Logs**: Review script output for warnings and errors
4. **Version Control**: Keep exported JSON files in version control for rollback capability

## Error Handling

All scripts include comprehensive error handling:
- Input validation
- Existence checks for related records
- Detailed error messages
- Transaction rollback on failures (where applicable)

## Contributing

When adding new scripts:
1. Follow the existing naming convention
2. Include detailed usage instructions in this README
3. Add proper error handling and logging
4. Test thoroughly before committing
