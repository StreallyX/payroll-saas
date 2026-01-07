/**
 * ====================================================================
 * EXPORT FEATURE REQUESTS - Export all feature requests to JSON
 * ====================================================================
 * 
 * Usage: npx ts-node scripts/export-requests.ts [output-file]
 * Example: npx ts-node scripts/export-requests.ts feature-requests-backup.json
 * 
 * This script exports all feature requests and their attachments to a JSON file.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExportData {
  exportDate: string;
  totalRequests: number;
  featureRequests: any[];
}

async function exportFeatureRequests() {
  try {
    console.log("🚀 Starting feature requests export...");

    // Fetch all feature requests with their attachments
    const featureRequests = await prisma.featureRequest.findMany({
      include: {
        attachments: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        confirmedByUser: {
          select: {
            email: true,
            name: true,
          },
        },
        rejectedByUser: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Prepare export data
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      totalRequests: featureRequests.length,
      featureRequests,
    };

    // Determine output file path
    const outputFile = process.argv[2] || `feature-requests-export-${Date.now()}.json`;
    const outputPath = path.resolve(process.cwd(), outputFile);

    // Write to file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(exportData, null, 2),
      "utf-8"
    );

    console.log("✅ Export completed successfully!");
    console.log(`📦 Total requests exported: ${featureRequests.length}`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log("\n📊 Summary by status:");

    // Status summary
    const statusCount: Record<string, number> = {};
    featureRequests.forEach((req) => {
      statusCount[req.status] = (statusCount[req.status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

  } catch (error) {
    console.error("❌ Error during export:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportFeatureRequests()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
