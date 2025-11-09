
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadFile } from "@/lib/s3";
import { getBucketConfig } from "@/lib/aws-config";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validate file type (PDF only for contracts)
    const fileType = file.type;
    if (fileType !== "application/pdf") {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont autorisés" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key with timestamp and original filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const s3Key = `uploads/contracts/${timestamp}-${sanitizedFileName}`;

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    return NextResponse.json({
      success: true,
      cloud_storage_path,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
