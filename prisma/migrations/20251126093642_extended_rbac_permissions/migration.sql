-- Migration for Extended RBAC Permissions
-- This migration adds comprehensive permissions for:
-- - Agency Portal functionality
-- - Payroll Partner Portal functionality  
-- - Reporting System
-- - Enhanced core functionality (payments, invoices, documents)

-- No schema changes needed - only permission data
-- Run seed-permissions.sql after this migration

-- Note: This is a data-only migration
-- Execute: psql -d your_database -f seed-permissions.sql
