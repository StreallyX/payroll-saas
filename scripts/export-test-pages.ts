/**
 * ====================================================================
 * EXPORT TEST PAGES STATUS - Export all page test status to JSON
 * ====================================================================
 * 
 * Usage: npx ts-node scripts/export-test-pages.ts [output-file]
 * Example: npx ts-node scripts/export-test-pages.ts test-pages-backup.json
 * 
 * This script exports all page test status records to a JSON file.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExportData {
  exportDate: string;
  totalPages: number;
  pageTestStatuses: any[];
}

async function exportTestPages() {
  try {
    console.log("🚀 Starting test pages export...");

    // Fetch all page test statuses
    const pageTestStatuses = await prisma.pageTestStatus.findMany({
      orderBy: [
        { pageRole: "asc" },
        { pageName: "asc" },
      ],
    });

    // Prepare export data
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      totalPages: pageTestStatuses.length,
      pageTestStatuses,
    };

    // Determine output file path
    const outputFile = process.argv[2] || `test-pages-export-${Date.now()}.json`;
    const outputPath = path.resolve(process.cwd(), outputFile);

    // Write to file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(exportData, null, 2),
      "utf-8"
    );

    console.log("✅ Export completed successfully!");
    console.log(`📦 Total pages exported: ${pageTestStatuses.length}`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log("\n📊 Summary by role:");

    // Role summary
    const roleCount: Record<string, { total: number; validated: number }> = {};
    pageTestStatuses.forEach((page) => {
      if (!roleCount[page.pageRole]) {
        roleCount[page.pageRole] = { total: 0, validated: 0 };
      }
      roleCount[page.pageRole].total++;
      if (page.isValidated) {
        roleCount[page.pageRole].validated++;
      }
    });

    Object.entries(roleCount).forEach(([role, stats]) => {
      console.log(`   - ${role}: ${stats.validated}/${stats.total} validated`);
    });

  } catch (error) {
    console.error("❌ Error during export:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportTestPages()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
