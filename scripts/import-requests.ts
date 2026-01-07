/**
 * ====================================================================
 * IMPORT FEATURE REQUESTS - Import feature requests from JSON
 * ====================================================================
 * 
 * Usage: npx ts-node scripts/import-requests.ts <input-file>
 * Example: npx ts-node scripts/import-requests.ts feature-requests-backup.json
 * 
 * This script imports feature requests from a JSON file.
 * WARNING: This will create new records, not update existing ones.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ImportData {
  exportDate: string;
  totalRequests: number;
  featureRequests: any[];
}

async function importFeatureRequests() {
  try {
    // Check if input file is provided
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error("❌ Error: Please provide an input file path");
      console.log("Usage: npx ts-node scripts/import-requests.ts <input-file>");
      process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), inputFile);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    console.log("🚀 Starting feature requests import...");
    console.log(`📁 Reading from: ${inputPath}`);

    // Read and parse JSON file
    const fileContent = fs.readFileSync(inputPath, "utf-8");
    const importData: ImportData = JSON.parse(fileContent);

    console.log(`📦 Total requests to import: ${importData.totalRequests}`);
    console.log(`📅 Export date: ${importData.exportDate}`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ request: any; error: string }> = [];

    // Import each feature request
    for (const request of importData.featureRequests) {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: request.userId },
        });

        if (!user) {
          throw new Error(`User not found: ${request.userId}`);
        }

        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: request.tenantId },
        });

        if (!tenant) {
          throw new Error(`Tenant not found: ${request.tenantId}`);
        }

        // Create feature request (without attachments for now)
        const createdRequest = await prisma.featureRequest.create({
          data: {
            tenantId: request.tenantId,
            userId: request.userId,
            userRole: request.userRole,
            pageUrl: request.pageUrl,
            pageName: request.pageName,
            actionType: request.actionType,
            title: request.title,
            description: request.description,
            conditions: request.conditions,
            priority: request.priority,
            status: request.status,
            rejectionReason: request.rejectionReason,
            confirmedBy: request.confirmedBy,
            confirmedAt: request.confirmedAt ? new Date(request.confirmedAt) : null,
            rejectedBy: request.rejectedBy,
            rejectedAt: request.rejectedAt ? new Date(request.rejectedAt) : null,
            createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
            updatedAt: request.updatedAt ? new Date(request.updatedAt) : new Date(),
          },
        });

        // Create attachments if any
        if (request.attachments && request.attachments.length > 0) {
          for (const attachment of request.attachments) {
            await prisma.featureRequestAttachment.create({
              data: {
                featureRequestId: createdRequest.id,
                fileUrl: attachment.fileUrl,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                fileType: attachment.fileType,
                uploadedAt: attachment.uploadedAt ? new Date(attachment.uploadedAt) : new Date(),
              },
            });
          }
        }

        successCount++;
        console.log(`✅ Imported: ${request.title} (${request.status})`);
      } catch (error: any) {
        errorCount++;
        errors.push({
          request: request.title || "Unknown",
          error: error.message,
        });
        console.error(`❌ Failed to import: ${request.title} - ${error.message}`);
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\n⚠️  Errors:");
      errors.forEach((err) => {
        console.log(`   - ${err.request}: ${err.error}`);
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
importFeatureRequests()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
