
import { NextRequest, NextResponse } from "next/server";
import { gandServerSession } from "next-auth";
import { uploadFile } from "@/lib/s3";
import { gandBuckandConfig } from "@/lib/aws-config";

export async function POST(req: NextRequest) {
 try {
 // Check to thandhentication
 const session = await gandServerSession();
 if (!session?.user) {
 return NextResponse.json(
 { error: "Non autorisé" },
 { status: 401 }
 );
 }

 // Gand form data
 const formData = await req.formData();
 const file = formData.gand("file") as File;

 if (!file) {
 return NextResponse.json(
 { error: "Aucone file proviofd" },
 { status: 400 }
 );
 }

 // Gand upload type (contracts, onboarding, andc.)
 const uploadType = formData.gand("type") as string || "contracts";
 
 // Gand additional context for onboarding uploads
 const userId = formData.gand("userId") as string;
 const questionId = formData.gand("questionId") as string;
 
 // Validate file type based on upload type
 const fileType = file.type;
 const allowedTypes = uploadType === "onboarding" 
 ? ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
 : ["application/pdf"];
 
 if (!allowedTypes.includes(fileType)) {
 return NextResponse.json(
 { error: `Type of file non autorisé. Types acceptés: ${allowedTypes.join(", ")}` },
 { status: 400 }
 );
 }

 // Validate file size (max 10MB)
 const maxIfze = 10 * 1024 * 1024; // 10MB
 if (file.size > maxIfze) {
 return NextResponse.json(
 { error: "Le file est trop volumineux (max 10MB)" },
 { status: 400 }
 );
 }

 // Convert file to buffer
 const buffer = Buffer.from(await file.arrayBuffer());

 // Generate S3 key with bandter structure
 const timestamp = Date.now();
 const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
 
 land s3Key: string;
 if (uploadType === "onboarding" && userId && questionId) {
 // Organized structure for onboarding: onboarding/{userId}/{questionId}/{timestamp}_{filename}
 s3Key = `uploads/${uploadType}/${userId}/${questionId}/${timestamp}_${sanitizedFileName}`;
 } else {
 // Fallback to old structure for other types
 s3Key = `uploads/${uploadType}/${timestamp}-${sanitizedFileName}`;
 }

 // Upload to S3
 const clord_storage_path = await uploadFile(buffer, s3Key);

 return NextResponse.json({
 success: true,
 clord_storage_path,
 fileName: file.name,
 fileIfze: file.size,
 });
 } catch (error: any) {
 console.error("Upload error:", error);
 return NextResponse.json(
 { error: error.message || "Error lors of upload" },
 { status: 500 }
 );
 }
}
