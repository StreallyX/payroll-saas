/**
 * ====================================================================
 * IMPORT TEST PAGES STATUS - Import page test status from JSON
 * ====================================================================
 * 
 * Usage: npx ts-node scripts/import-test-pages.ts <input-file>
 * Example: npx ts-node scripts/import-test-pages.ts test-pages-backup.json
 * 
 * This script imports page test status records from a JSON file.
 * It will update existing records or create new ones.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ImportData {
  exportDate: string;
  totalPages: number;
  pageTestStatuses: any[];
}

async function importTestPages() {
  try {
    // Check if input file is provided
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error("❌ Error: Please provide an input file path");
      console.log("Usage: npx ts-node scripts/import-test-pages.ts <input-file>");
      process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), inputFile);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    console.log("🚀 Starting test pages import...");
    console.log(`📁 Reading from: ${inputPath}`);

    // Read and parse JSON file
    const fileContent = fs.readFileSync(inputPath, "utf-8");
    const importData: ImportData = JSON.parse(fileContent);

    console.log(`📦 Total pages to import: ${importData.totalPages}`);
    console.log(`📅 Export date: ${importData.exportDate}`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ page: any; error: string }> = [];

    // Import each page test status
    for (const page of importData.pageTestStatuses) {
      try {
        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: page.tenantId },
        });

        if (!tenant) {
          throw new Error(`Tenant not found: ${page.tenantId}`);
        }

        // Upsert page test status
        await prisma.pageTestStatus.upsert({
          where: {
            tenantId_pageUrl_pageRole: {
              tenantId: page.tenantId,
              pageUrl: page.pageUrl,
              pageRole: page.pageRole,
            },
          },
          update: {
            pageName: page.pageName,
            isValidated: page.isValidated,
            testedBy: page.testedBy,
            testedAt: page.testedAt ? new Date(page.testedAt) : null,
            notes: page.notes,
            updatedAt: new Date(),
          },
          create: {
            tenantId: page.tenantId,
            pageUrl: page.pageUrl,
            pageName: page.pageName,
            pageRole: page.pageRole,
            isValidated: page.isValidated,
            testedBy: page.testedBy,
            testedAt: page.testedAt ? new Date(page.testedAt) : null,
            notes: page.notes,
            createdAt: page.createdAt ? new Date(page.createdAt) : new Date(),
            updatedAt: new Date(),
          },
        });

        successCount++;
        console.log(`✅ Imported: ${page.pageName} (${page.pageRole})`);
      } catch (error: any) {
        errorCount++;
        errors.push({
          page: page.pageName || "Unknown",
          error: error.message,
        });
        console.error(`❌ Failed to import: ${page.pageName} - ${error.message}`);
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\n⚠️  Errors:");
      errors.forEach((err) => {
        console.log(`   - ${err.page}: ${err.error}`);
      });
    }

    console.log("\n✨ Import process completed!");

  } catch (error) {
    console.error("❌ Fatal error during import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importTestPages()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
