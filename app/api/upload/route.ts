
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

    // Get upload type (contracts, onboarding, etc.)
    const uploadType = formData.get("type") as string || "contracts";
    
    // Get additional context for onboarding uploads
    const userId = formData.get("userId") as string;
    const questionId = formData.get("questionId") as string;
    
    // Validate file type based on upload type
    const fileType = file.type;
    const allowedTypes = uploadType === "onboarding" 
      ? ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      : ["application/pdf"];
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key with better structure
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    let s3Key: string;
    if (uploadType === "onboarding" && userId && questionId) {
      // Organized structure for onboarding: onboarding/{userId}/{questionId}/{timestamp}_{filename}
      s3Key = `uploads/${uploadType}/${userId}/${questionId}/${timestamp}_${sanitizedFileName}`;
    } else {
      // Fallback to old structure for other types
      s3Key = `uploads/${uploadType}/${timestamp}-${sanitizedFileName}`;
    }

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
