import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all feature requests...");

  const featureRequests = await prisma.featureRequest.findMany({
    include: {
      attachments: true,
      user: true,
      tenant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`Found ${featureRequests.length} feature requests`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `feature-requests-backup-${timestamp}.json`;
  const filePath = path.join(process.cwd(), "backups", fileName);

  // Create backups directory if it doesn't exist
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Convert BigInt to string for JSON serialization
  const serializable = JSON.parse(
    JSON.stringify(featureRequests, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));

  console.log(`Feature requests saved to: ${filePath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
