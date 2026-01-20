/**
 * ====================================================================
 * IMPORT FEATURE REQUESTS - Import feature requests from JSON
 * ====================================================================
 *
 * Usage: npx tsx scripts/import-requests.ts <input-file>
 * Example: npx tsx scripts/import-requests.ts feature-requests-export.json
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ===================================================================
// 🔧 REQUIRED CONFIGURATION
// ===================================================================

// ⚠️ MUST exist in the DB
const DEFAULT_TENANT_ID = "cmkml6jjc0000j6ewq5v9uyvy";

// OPTIONAL: user who will be considered as creator
// ➜ null = no default user
const DEFAULT_USER_ID: string | null = null;

// ===================================================================

interface ImportData {
  exportDate: string;
  totalRequests: number;
  featureRequests: any[];
}

// -------------------------------------------------------------------
// SAFE USER FK CHECK
// -------------------------------------------------------------------
async function safeUserId(
  id?: string | null
): Promise<string | undefined> {
  if (!id) return undefined;

  const exists = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  return exists ? id : undefined;
}

// -------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------
async function importFeatureRequests() {
  try {
    // --------------------------------------------------
    // ARGUMENT CHECK
    // --------------------------------------------------
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error("❌ Please provide an input file");
      process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ File not found: ${inputPath}`);
      process.exit(1);
    }

    console.log("🚀 Starting feature requests import...");
    console.log(`📁 Reading from: ${inputPath}`);

    // --------------------------------------------------
    // LOAD FILE
    // --------------------------------------------------
    const importData: ImportData = JSON.parse(
      fs.readFileSync(inputPath, "utf-8")
    );

    console.log(`📦 Total requests: ${importData.totalRequests}`);
    console.log(`📅 Export date: ${importData.exportDate}`);

    let success = 0;
    let failed = 0;

    // --------------------------------------------------
    // IMPORT LOOP
    // --------------------------------------------------
    for (const request of importData.featureRequests) {
      try {
        // ---------------- TENANT ----------------
        let tenantId = request.tenantId;

        const tenantExists = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenantExists) {
          console.warn(
            `⚠️ Tenant not found for "${request.title}", using DEFAULT_TENANT_ID`
          );
          tenantId = DEFAULT_TENANT_ID;
        }

        // ---------------- USERS (SAFE FK) ----------------
        const userId =
          (await safeUserId(request.userId)) ??
          (DEFAULT_USER_ID
            ? await safeUserId(DEFAULT_USER_ID)
            : undefined);

        const confirmedBy = await safeUserId(request.confirmedBy);
        const rejectedBy = await safeUserId(request.rejectedBy);

        // ---------------- BUILD DATA ----------------
        const data: any = {
          tenantId,
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
          confirmedAt: request.confirmedAt
            ? new Date(request.confirmedAt)
            : null,
          rejectedAt: request.rejectedAt
            ? new Date(request.rejectedAt)
            : null,
          createdAt: request.createdAt
            ? new Date(request.createdAt)
            : new Date(),
          updatedAt: request.updatedAt
            ? new Date(request.updatedAt)
            : new Date(),
        };

        // ➜ FK added ONLY if they are valid
        if (userId) data.userId = userId;
        if (confirmedBy) data.confirmedBy = confirmedBy;
        if (rejectedBy) data.rejectedBy = rejectedBy;

        // ---------------- CREATE ----------------
        const created = await prisma.featureRequest.create({
          data,
        });

        // ---------------- ATTACHMENTS ----------------
        if (request.attachments?.length) {
          for (const attachment of request.attachments) {
            await prisma.featureRequestAttachment.create({
              data: {
                featureRequestId: created.id,
                fileUrl: attachment.fileUrl,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                fileType: attachment.fileType,
                uploadedAt: attachment.uploadedAt
                  ? new Date(attachment.uploadedAt)
                  : new Date(),
              },
            });
          }
        }

        success++;
        console.log(`✅ Imported: ${request.title}`);
      } catch (err: any) {
        failed++;
        console.error(
          `❌ Failed to import "${request.title}": ${err.message}`
        );
      }
    }

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------
    console.log("\n📊 Import Summary");
    console.log(`   ✅ Imported: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log("\n✨ Import completed!");

  } finally {
    await prisma.$disconnect();
  }
}

// -------------------------------------------------------------------
importFeatureRequests().catch(() => process.exit(1));
